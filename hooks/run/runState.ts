import { atom, read, update } from 'claude-code'
import type { EngineInterface as Api } from 'claude-code'

import type { Run } from '../../types'
import { appendEvent, createRunDir } from './runRecord'

// 진행 중인 작업 하나를 mod 안에 둔다. 매 턴 프롬프트의 안내와 실행 폴더 위치가 여기서 나온다.
export const runAtom = atom({ plugin: 'qef', key: 'run' } as const, null)

const MODES: readonly Run['mode'][] = ['build', 'extend', 'refactor']

export function readRun($: Api) {
  return read($, runAtom)
}

const text = (raw: unknown) => (typeof raw === 'string' ? raw.trim() : '')

/** 문자열 배열이면 그대로, 아니면 null */
function strings(raw: unknown): string[] | null {
  return Array.isArray(raw) && raw.every((s) => typeof s === 'string') ? (raw as string[]) : null
}

/** 작업을 시작하고 실행 폴더를 만든다. 진행 중인 작업이 있으면 시작하지 않는다. */
export async function startRun($: Api, rawTask: unknown, rawMode: unknown, rawLanguage: unknown): Promise<string> {
  const current = await readRun($)
  if (current) {
    return `이미 진행 중인 작업이 있다: "${current.task}" (실행 폴더 ${current.runDir}). 그 작업을 끝내려면 qef_finish를 부른다.`
  }
  const task = text(rawTask)
  const language = text(rawLanguage)
  const mode = MODES.find((m) => m === rawMode)
  if (!task) return '작업을 시작하지 않았다: task(사용자 요청 한 줄)가 필요하다.'
  if (!mode) return `작업을 시작하지 않았다: mode는 ${MODES.join(', ')} 중 하나여야 한다.`
  if (!language) return '작업을 시작하지 않았다: language(사용자가 이 대화에서 쓰는 언어)가 필요하다.'
  const root = (await $.session.cwd()).replace(/\/+$/, '')
  const at = await $.clock.now()
  const created = await createRunDir($, root, at)
  if ('error' in created) return `작업을 시작하지 않았다: ${created.error}`
  const run: Run = { task, mode, root, runDir: created.dir, language, startedAt: at }
  await update($, runAtom, () => run)
  await appendEvent($, run, { at, kind: 'start', summary: `${task} (모드 ${mode}, 언어 ${language})` })
  return `작업을 시작했다. 실행 폴더: ${created.dir}. run.md와 ledger.md를 여기에 쓴다.`
}

/** 작업을 끝내고 끝에 보고한 내용을 실행 기록에 남긴다 */
export async function finishRun(
  $: Api, rawSummary: unknown, rawDecisions: unknown, rawUnverified: unknown, rawDefects: unknown,
): Promise<string> {
  const run = await readRun($)
  if (!run) return '진행 중인 qef 작업이 없다.'
  const summary = text(rawSummary)
  const decisions = strings(rawDecisions)
  const unverified = strings(rawUnverified)
  const defects = strings(rawDefects)
  if (!summary) return '끝내지 않았다: summary(바뀐 것과 동작 확인 결과 요약)가 필요하다.'
  if (!decisions || !unverified || !defects) {
    return '끝내지 않았다: decisions(혼자 정한 것과 감수한 것), unverified(확인하지 못한 것), defects(남긴 결함)를 문자열 배열로 함께 넘긴다. 없으면 [].'
  }
  await appendEvent($, run, { at: await $.clock.now(), kind: 'finish', summary, decisions, unverified, defects })
  await update($, runAtom, () => null)
  return `작업을 끝냈다. 기록: ${run.runDir}. 사용자에게 바뀐 것, 동작 확인, 판단 기록, 남긴 결함을 보인다.`
}
