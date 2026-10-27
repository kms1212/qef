import { atom, read, update } from 'claude-code'
import type { EngineInterface as Api } from 'claude-code'

import type { FileRole, PlannedFile, Run, RunStatus } from '../../types'
import { changedPaths, strayFiles } from '../guard/treeCheck'
import { syncSettings } from '../sandbox/stageSettings'
import { appendEvent, createRunDir, missingFiles } from './runRecord'
import { REOPEN_FROM, STAGES, TEST_REVISION, TEST_REVISION_FROM, nextStageId, stageById } from './stages'

// 진행 상태는 mod 안에만 있다. 모델이 파일을 고쳐 단계를 건너뛸 수 없고, 승인은 사용자 입력으로만 바뀐다.
export const runAtom = atom({ plugin: 'qef', key: 'run' } as const, null)

const ROLES: readonly FileRole[] = ['test', 'impl', 'doc', 'build']
const WORKING: RunStatus = 'working'
const AWAITING: RunStatus = 'awaiting-approval'
const DONE: RunStatus = 'done'
const FIRST = STAGES[0]!

export function readRun($: Api) {
  return read($, runAtom)
}

/** 상태를 바꾸고, 바뀐 상태에 맞게 샌드박스·거부 규칙을 설정 파일에 맞춘다. 맞추지 못했으면 그 이유를 돌려준다. */
async function save($: Api, change: (r: Run | null) => Run | null): Promise<string> {
  const before = await readRun($)
  const after = change(before)
  await update($, runAtom, () => after)
  const root = after?.root ?? before?.root
  if (!root) return ''
  const { applied, warning } = await syncSettings($, root, after, before?.settings ?? null)
  if (after) await update($, runAtom, (r) => r && { ...r, settings: applied, settingsWarning: warning })
  return warning ? ` 주의: ${warning}` : ''
}

/** 단계에 들어간 기록을 하나 더한다 */
const entered = (r: Run, stage: string, at: number) => [...(r.stageLog ?? []), { stage, at }]

/** deviations 입력을 검사한다. 문자열 배열이 아니면 거부 사유를 돌려준다. */
function parseDeviations(raw: unknown): string[] | string {
  if (!Array.isArray(raw) || raw.some((d) => typeof d !== 'string')) {
    return 'deviations(이 단계에서 지시와 다르게 한 것, 막힌 것, 우회한 것. 서브에이전트 보고의 deviations도 옮긴다. 없으면 [])를 문자열 배열로 함께 제출해야 한다.'
  }
  return raw as string[]
}

export async function startRun($: Api, task: string, mode: Run['mode'], rawLanguage: unknown): Promise<string> {
  const current = await readRun($)
  if (current && current.status !== 'done') {
    return `이미 진행 중인 작업이 있다: "${current.task}" (${stageById(current.stage)?.label}). 사용자가 /qef-reset 으로 끝내야 새로 시작할 수 있다.`
  }
  const language = typeof rawLanguage === 'string' ? rawLanguage.trim() : ''
  if (!language) return '작업을 시작하지 않았다: language(사용자가 이 대화에서 쓰는 언어)가 필요하다.'
  const root = (await $.session.cwd()).replace(/\/+$/, '')
  const at = await $.clock.now()
  const created = await createRunDir($, root, at)
  if ('error' in created) return `작업을 시작하지 않았다: ${created.error}`
  const baseline = (await changedPaths($, root)) ?? []
  const warn = await save($, () => ({
    task, mode, root, stage: FIRST.id, status: WORKING, testRevision: null, reopened: null,
    requirements: null, files: [], submissions: [], approvals: [], baseline, settings: null, settingsWarning: null,
    runDir: created.dir, stageLog: [{ stage: FIRST.id, at }], language,
  }))
  await appendEvent($, await readRun($), { at, kind: 'start', stage: FIRST.id, summary: `${task} (모드 ${mode}, 언어 ${language})` })
  return `작업을 시작했다. 현재 단계: ${FIRST.label}. 실행 폴더: ${created.dir} (mod가 만들었다. 실행 기록은 여기에 쓴다). ` +
    `작업 동안 샌드박스가 켜지고, 단계마다 쓸 수 있는 파일이 셸까지 포함해 제한된다.${warn}`
}

function parseFiles(raw: unknown): PlannedFile[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'artifact.files는 비어 있지 않은 배열이어야 한다.'
  const files: PlannedFile[] = []
  for (const f of raw) {
    const o = f as Record<string, unknown>
    if (typeof o?.path !== 'string' || !o.path || typeof o.responsibility !== 'string' || !ROLES.includes(o.role as FileRole)) {
      return `artifact.files 항목은 { path, role: ${ROLES.join('|')}, responsibility } 형식이어야 한다: ${JSON.stringify(f)}`
    }
    files.push({ path: o.path.replace(/^\.\//, ''), role: o.role as FileRole, responsibility: o.responsibility })
  }
  return files
}

/** 모델이 단계를 마쳤다고 제출한다. 체크포인트면 승인 대기, 아니면 다음 단계로 간다. */
export async function submitStage(
  $: Api, summary: string, artifact: Record<string, unknown> | undefined, nextComponent: boolean, rawDeviations: unknown,
): Promise<string> {
  const run = await readRun($)
  if (!run || run.status === 'done') return '진행 중인 작업이 없다. qef_start로 시작한다.'
  if (run.testRevision) return '테스트 보완 중이다. qef_test_revision action=exit로 먼저 돌아간다.'
  const deviations = parseDeviations(rawDeviations)
  if (typeof deviations === 'string') return deviations
  const stage = stageById(run.stage)!
  const at = await $.clock.now()

  let patch: Partial<Run> = {}
  if (stage.id === 'requirements') {
    if (!artifact?.requirements) return '요구사항 단계는 artifact.requirements(승인받을 요구사항 JSON)를 함께 제출해야 한다.'
    patch = { requirements: artifact.requirements }
  }
  if (stage.id === 'design') {
    const files = parseFiles(artifact?.files)
    if (typeof files === 'string') return files
    patch = { files }
  }

  let note = ''
  if (run.files.length) {
    const stray = await strayFiles($, run)
    if (stray === null) note = ' git 저장소가 아니라 설계 트리 밖 변경은 검사하지 못했다.'
    else if (stray.length) {
      return `설계 트리 밖에서 바뀐 파일이 있어 제출하지 않았다: ${stray.join(', ')}. ` +
        '꼭 필요한 파일이면 mcp__qef__qef_add_file로 이유와 함께 등록하고, 아니면 되돌린 뒤 다시 제출한다.'
    }
  }

  const missing = await missingFiles($, run, stage.id)
  if (missing.length) {
    return `실행 기록에 이 단계에서 쓴 파일이 없어 제출하지 않았다 (실행 폴더 ${run.runDir}): ${missing.join(', ')}. ` +
      '단계 지시가 정한 서브에이전트 보고와 기록 파일을 남긴 뒤 다시 제출한다. 할 일이 없는 컴포넌트는 reports/<단계 id>-<컴포넌트>-skip.json에 이유를 쓴다.'
  }

  const submission = run.reopened
    ? { stage: stage.id, summary, at, revisedFor: run.reopened.reason, deviations }
    : { stage: stage.id, summary, at, deviations }
  const submissions = [...run.submissions, submission]
  const event = { at, kind: 'submit', stage: stage.id, summary, deviations } as const
  if (stage.gateAfter) {
    const warn = await save($, (r) => (r ? { ...r, ...patch, submissions, status: AWAITING, reopened: null } : r))
    await appendEvent($, run, event)
    return `${stage.label} 결과를 제출했다. 체크포인트라서 사용자가 패널의 승인 버튼이나 /qef-approve 로 승인해야 다음 단계로 간다. 사용자에게 결과를 보여주고 승인을 기다린다. 지적을 받으면 반영한 뒤 다시 제출한다.${note}${warn}`
  }
  const to = stage.id === 'rest-impl' && nextComponent ? 'rest-tests' : nextStageId(stage.id)
  if (!to) return '다음 단계가 없다.'
  const warn = await save($, (r) => (r ? { ...r, ...patch, submissions, stage: to, stageLog: entered(r, to, at) } : r))
  await appendEvent($, run, event)
  return `${stage.label}을(를) 마쳤다. 현재 단계: ${stageById(to)?.label}.${note}${warn}`
}

/**
 * 체크포인트 승인 대기를 풀고 같은 단계로 돌아가 사용자 지적을 반영한다.
 * 되돌리기만 하므로 모델이 불러도 체크포인트를 건너뛸 수 없다. 다시 제출하면 승인 대기로 돌아간다.
 */
export async function reopenStage($: Api, reason: string): Promise<string> {
  const run = await readRun($)
  if (!run || run.status !== 'awaiting-approval') return '승인 대기 중인 체크포인트가 없다.'
  const stage = stageById(run.stage)!
  if (!REOPEN_FROM.has(stage.id)) {
    return `${stage.label} 체크포인트는 승인 대기 중에도 qef_submit으로 다시 제출할 수 있다. 반영한 결과를 다시 제출한다.`
  }
  if (!reason) return 'reason(사용자 원문을 포함한 지적 요약)이 필요하다.'
  const at = await $.clock.now()
  const round = run.submissions.filter((s) => s.stage === stage.id && s.revisedFor).length + 1
  const warn = await save($, (r) => r && { ...r, status: WORKING, reopened: { reason, at, round } })
  await appendEvent($, run, { at, kind: 'reopen', stage: stage.id, reason })
  return `${stage.label} 체크포인트에서 지적 반영 ${round}차에 들어갔다. 이 단계의 쓰기 규칙이 다시 적용된다. 반영을 마치면 qef_submit으로 다시 제출한다.${warn}`
}

/** 사용자 승인. 모델이 부를 수 있는 경로는 없다 (패널 버튼과 사용자가 입력한 명령만). */
export async function approveStage($: Api): Promise<string> {
  const run = await readRun($)
  if (!run || run.status !== 'awaiting-approval') return '승인할 체크포인트가 없다.'
  const stage = stageById(run.stage)!
  const at = await $.clock.now()
  const to = nextStageId(stage.id)
  const warn = await save($, (r) => r && {
    ...r,
    approvals: [...r.approvals, { stage: stage.id, at }],
    stage: to ?? r.stage,
    status: to ? WORKING : DONE,
    stageLog: to ? entered(r, to, at) : r.stageLog,
  })
  await appendEvent($, run, { at, kind: 'approve', stage: stage.id })
  return (to ? `${stage.label}을(를) 승인했다. 다음 단계: ${stageById(to)?.label}.` : `${stage.label}을(를) 승인했다. 작업이 끝났다.`) + warn
}

export async function resetRun($: Api): Promise<string> {
  const run = await readRun($)
  if (run) await appendEvent($, run, { at: await $.clock.now(), kind: 'reset', stage: run.stage })
  const warn = await save($, () => null)
  return `qef 작업을 끝냈다.${warn}`
}

/** 구현 중 설계에 없던 파일이 필요해졌을 때 트리에 더한다. 패널에 따로 표시된다. */
export async function addPlannedFile($: Api, raw: Record<string, unknown>): Promise<string> {
  const run = await readRun($)
  if (!run || run.status === 'done') return '진행 중인 작업이 없다.'
  if (['requirements', 'design'].includes(run.stage)) return '설계 단계에서는 파일 트리를 qef_submit의 artifact.files로 제출한다.'
  const parsed = parseFiles([raw])
  if (typeof parsed === 'string') return parsed
  if (typeof raw.reason !== 'string' || !raw.reason) return 'reason(설계에 있는 파일로는 왜 안 되는지)이 필요하다.'
  const file: PlannedFile = { ...parsed[0]!, addedLater: { stage: run.stage, reason: raw.reason } }
  if (run.files.some((f) => f.path === file.path)) return `${file.path}는 이미 트리에 있다.`
  const warn = await save($, (r) => r && { ...r, files: [...r.files, file] })
  await appendEvent($, run, { at: await $.clock.now(), kind: 'add-file', stage: run.stage, summary: file.path, reason: raw.reason })
  return `${file.path}를 파일 트리에 더했다. 사용자에게 보이는 패널에 "구현 중 추가된 파일"로 표시된다.${warn}`
}

export async function toggleTestRevision($: Api, action: string, reason: string): Promise<string> {
  const run = await readRun($)
  if (!run || run.status !== 'working') return '진행 중인 단계가 없다.'
  if (action === 'enter') {
    if (run.testRevision) return '이미 테스트 보완 중이다.'
    if (!TEST_REVISION_FROM.has(run.stage)) return `${stageById(run.stage)?.label} 단계에서는 테스트 보완에 들어갈 수 없다.`
    if (!reason) return 'reason(어떤 테스트가 왜 틀렸다고 보는지)이 필요하다.'
    const at = await $.clock.now()
    const warn = await save($, (r) => r && {
      ...r, testRevision: { returnTo: r.stage, reason }, stage: TEST_REVISION.id, stageLog: entered(r, TEST_REVISION.id, at),
    })
    await appendEvent($, run, { at, kind: 'test-revision-enter', stage: run.stage, reason })
    return `${TEST_REVISION.label}에 들어갔다. 테스트 파일만 쓸 수 있다.${warn}`
  }
  if (action === 'exit') {
    if (!run.testRevision) return '테스트 보완 중이 아니다.'
    const missing = await missingFiles($, run, TEST_REVISION.id)
    if (missing.length) return `실행 기록에 테스트 보완 보고가 없어 돌아가지 않았다 (실행 폴더 ${run.runDir}): ${missing.join(', ')}.`
    const back = run.testRevision.returnTo
    const at = await $.clock.now()
    const warn = await save($, (r) => r && { ...r, testRevision: null, stage: back, stageLog: entered(r, back, at) })
    await appendEvent($, run, { at, kind: 'test-revision-exit', stage: back })
    return `${stageById(back)?.label} 단계로 돌아갔다.${warn}`
  }
  return 'action은 enter 또는 exit다.'
}
