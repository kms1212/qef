import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { STAGES, TEST_REVISION } from '../hooks/run/stages'
import { requiredFiles } from '../hooks/run/requiredFiles'

const ROOT = '/proj'
const PANE = {
  plugin: 'qef',
  component: 'Pane',
  requestId: 'qef-progress',
  props: { title: 'qef 진행', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

const SETTINGS = `${ROOT}/.claude/settings.local.json`
const HOME = '/home/u'
const RUNS = `${HOME}/.qef/runs/-proj/`

// 엔진 쪽 응답을 흉내 낸다: 이 플러그인 아래에는 아무것도 없다.
// 파일은 메모리에, git status는 git.status에 둔다. 설정 읽기는 설정 파일을 그대로 돌려준다.
function stubEngine(on: On) {
  const files = new Map<string, string>()
  const git = { status: '' }
  const clock = { now: 1 }
  const isDir = (path: string) => [...files.keys()].some((k) => k.startsWith(`${path}/`))
  on('fs.exists', (_, e) => ({ value: files.has(e.path) || isDir(e.path) }))
  on('fs.list', (_, e) => {
    const names = new Set<string>()
    for (const k of files.keys()) {
      if (!k.startsWith(`${e.path}/`)) continue
      const rest = k.slice(e.path.length + 1)
      if (!rest.includes('/')) names.add(rest)
    }
    return {
      value: [...names].map((name) => ({ name, kind: 'file' as const, size: 1, mtimeMs: clock.now, isLink: false })),
    }
  })
  on('fs.read', (_, e) => {
    const text = files.get(e.path)
    if (text === undefined) throw new Error(`no file: ${e.path}`)
    return { value: text }
  })
  on('fs.write', (_, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('settings.read', () => ({ value: JSON.parse(files.get(SETTINGS) ?? '{}') }))
  on('process.run', (_, e) => ({
    value: {
      exitCode: 0, stdout: e.argv[0] === 'printenv' ? `${HOME}\n` : git.status, stderr: '',
      isStdoutTruncated: false, isStderrTruncated: false,
    },
  }))
  on('clock.sleep', () => ({ value: undefined }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('tool.register', (_, e) => ({ value: { tool: e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.cwd', () => ({ value: ROOT }))
  on('clock.now', () => ({ value: clock.now }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: 'ran' }))
  on('tool.check', () => ({ decision: 'allow' }))
  return { files, git, clock }
}

/** mod가 만든 실행 폴더 */
const runDirOf = (files: Map<string, string>) =>
  [...files.keys()].find((k) => k.startsWith(RUNS) && k.endsWith('/events.jsonl'))!.replace(/\/events\.jsonl$/, '')

/** 모든 단계의 필수 실행 기록 파일을 만든다 (서브에이전트 보고를 흉내 낸다) */
function fillRecords(files: Map<string, string>, mode: 'build' | 'extend' | 'refactor' = 'extend') {
  const dir = runDirOf(files)
  for (const stage of [...STAGES, TEST_REVISION]) {
    for (const req of requiredFiles({ mode } as never, stage.id)) {
      for (let i = 0; i < req.min; i++) files.set(`${dir}/${req.pattern.replace('*', `x${i}`)}`, '{}')
    }
  }
}

const settingsOf = (files: Map<string, string>) =>
  JSON.parse(files.get(SETTINGS) ?? '{}') as { sandbox?: { enabled?: boolean }; permissions?: { deny?: string[] }; model?: string }

const DESIGN_FILES = [
  { path: 'src/user_copy.c', role: 'impl', responsibility: '사용자 메모리를 확인 후 복사한다' },
  { path: 'tests/user_copy_test.c', role: 'test', responsibility: '사용자 메모리 복사를 검증한다' },
]

test('설계 단계에서는 프로젝트 파일을 쓸 수 없고, 체크포인트는 모델이 넘길 수 없다', async ($, on) => {
  const { files } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })

  await $.tool.call({ tool: 'mcp__qef__qef_start', task: '시스템 콜 사용자 포인터', mode: 'extend', language: '한국어' } as never)
  fillRecords(files)

  // 요구사항 단계: 쓰기 금지
  const early = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/src/user_copy.c`, content: 'x' } as never)
  expect(early.deny).toContain('요구사항 확정')

  // 프로젝트 밖은 막지 않는다
  const outside = await $.tool.call({ tool: 'Write', file_path: '/tmp/note.md', content: 'x' } as never)
  expect(outside.deny).toBeUndefined()

  // 요구사항 제출 → 승인 대기
  const submitted = await $.tool.call({
    tool: 'mcp__qef__qef_submit', summary: '요구사항 요약', deviations: [], artifact: { requirements: { summary: 's' } },
  } as never)
  expect(String(submitted.result)).toContain('체크포인트')

  // 모델(플러그인)이 부른 승인 명령은 거절된다
  const byModel = await $.command.run({
    command: 'qef-approve', args: '', origin: { kind: 'plugin', name: 'other' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(byModel.text).toContain('사용자가 직접')

  // 승인 대기 중에는 셸을 포함해 프로젝트 전체 쓰기가 설정으로 막혀 있다
  expect(settingsOf(files).sandbox?.enabled).toBe(true)
  expect(settingsOf(files).permissions?.deny).toEqual(['Edit(/**)'])

  // 패널 버튼으로 승인하면 설계 단계로 간다
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'approve' })
  await ui.unmount()

  const status = await $.tool.call({ tool: 'mcp__qef__qef_status' } as never)
  expect(String(status.result)).toContain('구조 설계·검토')
})

test('테스트 작성 단계는 테스트 파일만, 구현 단계는 구현 파일만 쓸 수 있다', async ($, on) => {
  const { files } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'mcp__qef__qef_start', task: 't', mode: 'extend', language: '한국어' } as never)
  fillRecords(files)
  await $.tool.call({ tool: 'mcp__qef__qef_submit', summary: 'r', deviations: [], artifact: { requirements: {} } } as never)
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'approve' })
  await ui.unmount()
  await $.tool.call({ tool: 'mcp__qef__qef_submit', summary: 'd', deviations: [], artifact: { files: DESIGN_FILES } } as never)
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'approve' })
  await ui.unmount()

  // 공통부 테스트 작성
  const testWrite = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/tests/user_copy_test.c`, content: 'x' } as never)
  expect(testWrite.deny).toBeUndefined()
  const implWrite = await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/user_copy.c`, old_string: 'a', new_string: 'b' } as never)
  expect(implWrite.deny).toContain('impl')
  const unplanned = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/src/utils.c`, content: 'x' } as never)
  expect(unplanned.deny).toContain('파일 트리에 없다')

  // 공통부 구현
  await $.tool.call({ tool: 'mcp__qef__qef_submit', summary: 'tests', deviations: [] } as never)
  const implNow = await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/user_copy.c`, old_string: 'a', new_string: 'b' } as never)
  expect(implNow.deny).toBeUndefined()
  const testNow = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/tests/user_copy_test.c`, content: 'y' } as never)
  expect(testNow.deny).toContain('테스트 보완')

  // 테스트 보완에 들어가면 테스트만 쓸 수 있다
  await $.tool.call({ tool: 'mcp__qef__qef_test_revision', action: 'enter', reason: '기대값이 요구사항과 다름' } as never)
  const revise = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/tests/user_copy_test.c`, content: 'z' } as never)
  expect(revise.deny).toBeUndefined()
})

test('체크포인트 승인 대기를 풀면 그 단계 규칙대로 쓸 수 있고, 반영 중에는 승인할 수 없다', async ($, on) => {
  const { files } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  const approve = async () => {
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    await ui.press({ key: 'approve' })
    await ui.unmount()
  }
  const submit = (summary: string, artifact?: Record<string, unknown>) =>
    $.tool.call({ tool: 'mcp__qef__qef_submit', summary, deviations: [], ...(artifact ? { artifact } : {}) } as never)
  const reopen = (reason: string) => $.tool.call({ tool: 'mcp__qef__qef_reopen', reason } as never)
  const writeImpl = () => $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/user_copy.c`, old_string: 'a', new_string: 'b' } as never)

  await $.tool.call({ tool: 'mcp__qef__qef_start', task: 't', mode: 'extend', language: '한국어' } as never)
  fillRecords(files)
  await submit('r', { requirements: {} })
  await approve()

  // 설계 체크포인트는 승인 대기 중에도 다시 제출하면 되므로 풀지 않는다
  await submit('d', { files: DESIGN_FILES })
  expect(String((await reopen('사용자: "경로 이름 바꿔줘"')).result)).toContain('다시 제출')
  await approve()

  // 공통부 테스트 작성 → 구현 → 검토 → 보완 → 테스트 실행(체크포인트)
  for (const s of ['tests', 'impl', 'review', 'fix']) await submit(s)

  // 승인 대기가 아니면 풀 수 없다
  expect(String((await reopen('x')).result)).toContain('승인 대기 중인 체크포인트가 없다')

  await submit('verify')
  expect((await writeImpl()).deny).toContain('승인을 기다리는')

  // 이유 없이는 풀 수 없다
  expect(String((await reopen('')).result)).toContain('reason')

  // 풀면 공통부 테스트 실행 단계의 규칙(impl만)이 다시 적용된다
  expect(String((await reopen('사용자: "오류 메시지를 한국어로"')).result)).toContain('1차')
  expect((await writeImpl()).deny).toBeUndefined()
  const testWrite = await $.tool.call({ tool: 'Write', file_path: `${ROOT}/tests/user_copy_test.c`, content: 'x' } as never)
  expect(testWrite.deny).toContain('테스트 보완')

  // 반영 중에는 승인 버튼이 없다
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'approve' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /지적 반영 1차/ })).toBeDefined()
  await ui.unmount()

  // 다시 제출하면 승인 대기로 돌아가고, 다음 반영은 2차가 된다
  await submit('verify again')
  expect((await writeImpl()).deny).toContain('승인을 기다리는')
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'approve' })).toBeDefined()
  await ui.unmount()
  expect(String((await reopen('사용자: "하나 더"')).result)).toContain('2차')
})

test('단계마다 설정 파일의 거부 규칙이 바뀌고, 끝내면 사용자 설정만 남는다', async ($, on) => {
  const { files, git } = stubEngine(on)
  files.set(SETTINGS, JSON.stringify({ model: 'x', permissions: { deny: ['Bash(rm:*)'] } }))
  git.status = ' M README.md\0'
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  const approve = async () => {
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    await ui.press({ key: 'approve' })
    await ui.unmount()
  }
  const submit = (summary: string, artifact?: Record<string, unknown>) =>
    $.tool.call({ tool: 'mcp__qef__qef_submit', summary, deviations: [], ...(artifact ? { artifact } : {}) } as never)

  await $.tool.call({ tool: 'mcp__qef__qef_start', task: 't', mode: 'extend', language: '한국어' } as never)
  fillRecords(files)
  expect(settingsOf(files).permissions?.deny).toEqual(['Bash(rm:*)', 'Edit(/**)'])
  await submit('r', { requirements: {} })
  await approve()
  await submit('d', {
    files: [...DESIGN_FILES, { path: 'app/users/[id]/page.tsx', role: 'impl', responsibility: '사용자 화면을 그린다' }],
  })
  await approve()

  // 공통부 테스트 작성: 구현 파일만 막는다 (경로의 [ ]는 패턴 문자가 아니게 바꾼다)
  expect(settingsOf(files).permissions?.deny).toEqual(['Bash(rm:*)', 'Edit(/src/user_copy.c)', 'Edit(/app/users/\\[id\\]/page.tsx)'])

  // 설계 트리 밖에서 바뀐 파일이 있으면 제출이 거부된다 (시작 전부터 바뀐 README.md는 뺀다)
  git.status = ' M README.md\0 M tests/user_copy_test.c\0?? src/utils.ts\0'
  const refused = await submit('tests')
  expect(String(refused.result)).toContain('src/utils.ts')
  expect(String(refused.result)).not.toContain('README.md')

  // 지우고 다시 내면 구현 단계로 가고, 이번에는 테스트 파일을 막는다
  git.status = ' M README.md\0 M tests/user_copy_test.c\0'
  expect(String((await submit('tests')).result)).toContain('공통부 구현')
  expect(settingsOf(files).permissions?.deny).toEqual(['Bash(rm:*)', 'Edit(/tests/user_copy_test.c)'])

  // 사용자가 작업을 끝내면 qef가 넣은 것만 빠진다
  await $.command.run({
    command: 'qef-reset', args: '', origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(settingsOf(files)).toEqual({ model: 'x', permissions: { deny: ['Bash(rm:*)'] } })
})

test('mod가 실행 폴더와 사건 기록을 남기고, 기록 파일과 어긋남이 없으면 제출을 받지 않는다', async ($, on) => {
  const { files } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })

  // 언어가 없으면 시작하지 않는다
  const noLanguage = await $.tool.call({ tool: 'mcp__qef__qef_start', task: 't', mode: 'refactor' } as never)
  expect(String(noLanguage.result)).toContain('language')

  // 시작하면 실행 폴더와 events.jsonl이 생기고, 그 경로를 알려 준다
  const started = await $.tool.call({ tool: 'mcp__qef__qef_start', task: 't', mode: 'refactor', language: '한국어' } as never)
  const dir = runDirOf(files)
  expect(String(started.result)).toContain(dir)
  const status = String((await $.tool.call({ tool: 'mcp__qef__qef_status' } as never)).result)
  expect(status).toContain(`실행 폴더: ${dir}`)
  expect(status).toContain('사용자에게 하는 말은 모두 한국어로 쓴다')
  const events = () => (files.get(`${dir}/events.jsonl`) ?? '').trim().split('\n').map((l) => JSON.parse(l))
  expect(events()[0]).toMatchObject({ kind: 'start', stage: 'requirements' })

  // deviations가 없으면 받지 않는다
  const noDeviations = await $.tool.call({ tool: 'mcp__qef__qef_submit', summary: 'r', artifact: { requirements: {} } } as never)
  expect(String(noDeviations.result)).toContain('deviations')

  // 이 단계의 기록 파일이 없으면 받지 않는다
  const noRecords = await $.tool.call({
    tool: 'mcp__qef__qef_submit', summary: 'r', deviations: [], artifact: { requirements: {} },
  } as never)
  expect(String(noRecords.result)).toContain('requirements.json')
  expect(String(noRecords.result)).toContain('run.md')

  // 기록 파일을 남기고 어긋남을 적어 내면 받고, 사건 기록과 패널에 남는다
  files.set(`${dir}/run.md`, '# t')
  files.set(`${dir}/requirements.json`, '{}')
  const accepted = await $.tool.call({
    tool: 'mcp__qef__qef_submit', summary: 'r', deviations: ['요구사항 읽기를 Explore 대신 직접 함'], artifact: { requirements: {} },
  } as never)
  expect(String(accepted.result)).toContain('체크포인트')
  expect(events()[1]).toMatchObject({ kind: 'submit', stage: 'requirements', deviations: ['요구사항 읽기를 Explore 대신 직접 함'] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /어긋남 1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Explore 대신 직접/ })).toBeDefined()
  await ui.press({ key: 'approve' })
  await ui.unmount()
  expect(events()[2]).toMatchObject({ kind: 'approve', stage: 'requirements' })

  // refactor 모드의 설계는 경계 조사와 경계 파일까지 있어야 한다
  for (const req of requiredFiles({ mode: 'extend' } as never, 'design')) {
    for (let i = 0; i < req.min; i++) files.set(`${dir}/${req.pattern.replace('*', `x${i}`)}`, '{}')
  }
  const noBoundaries = await $.tool.call({
    tool: 'mcp__qef__qef_submit', summary: 'd', deviations: [], artifact: { files: DESIGN_FILES },
  } as never)
  expect(String(noBoundaries.result)).toContain('design/boundaries.json')
  expect(String(noBoundaries.result)).toContain('design-research-boundaries.json')
})
