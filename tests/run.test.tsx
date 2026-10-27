import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const ROOT = '/proj'
const HOME = '/home/u'
const RUNS = `${HOME}/.qef/runs/-proj/`

// 엔진 쪽 응답을 흉내 낸다: 파일은 메모리에 두고, 홈 경로는 HOME으로 돌려준다.
function stubEngine(on: On) {
  const files = new Map<string, string>()
  const clock = { now: 1 }
  const isDir = (path: string) => [...files.keys()].some((k) => k.startsWith(`${path}/`))
  on('fs.exists', (_, e) => ({ value: files.has(e.path) || isDir(e.path) }))
  on('fs.read', (_, e) => {
    const text = files.get(e.path)
    if (text === undefined) throw new Error(`no file: ${e.path}`)
    return { value: text }
  })
  on('fs.write', (_, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('process.run', () => ({
    value: { exitCode: 0, stdout: `${HOME}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('tool.register', (_, e) => ({ value: { tool: e.name } }))
  on('session.cwd', () => ({ value: ROOT }))
  on('clock.now', () => ({ value: clock.now }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: 'ran' }))
  return { files, clock }
}

/** mod가 만든 실행 폴더 */
const runDirOf = (files: Map<string, string>) =>
  [...files.keys()].find((k) => k.startsWith(RUNS) && k.endsWith('/events.jsonl'))!.replace(/\/events\.jsonl$/, '')

const eventsOf = (files: Map<string, string>, dir: string) =>
  (files.get(`${dir}/events.jsonl`) ?? '').trim().split('\n').map((l) => JSON.parse(l) as Record<string, unknown>)

type ToolCaller = { tool: { call: (event: never) => Promise<{ result?: unknown }> } }

const call = async ($: ToolCaller, tool: string, input: Record<string, unknown> = {}) =>
  String((await $.tool.call({ tool: `mcp__qef__${tool}`, ...input } as never)).result)

test('작업을 시작하면 실행 폴더를 만들고, 매 턴 안내에 언어와 할 일 목록 위치가 나온다', async ($, on) => {
  const { files } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })

  // 필요한 값이 없으면 시작하지 않는다
  expect(await call($, 'qef_start', { task: 't', mode: 'refactor' })).toContain('language')
  expect(await call($, 'qef_start', { task: 't', mode: 'cleanup', language: '한국어' })).toContain('mode')
  expect(await call($, 'qef_status')).toContain('진행 중인 qef 작업이 없다')

  const started = await call($, 'qef_start', { task: 'src/common 정리해줘.', mode: 'refactor', language: '한국어' })
  const dir = runDirOf(files)
  expect(started).toContain(dir)
  expect(eventsOf(files, dir)[0]).toMatchObject({ kind: 'start', summary: 'src/common 정리해줘. (모드 refactor, 언어 한국어)' })

  const status = await call($, 'qef_status')
  expect(status).toContain('사용자에게 하는 말은 모두 한국어로 쓴다')
  expect(status).toContain(`실행 폴더: ${dir}`)
  expect(status).toContain('(아직 없다)')

  // 할 일 목록을 쓰면 상태에 그대로 나온다
  files.set(`${dir}/ledger.md`, '| L1 | 죽은 코드 지우기 | 끝 |')
  expect(await call($, 'qef_status')).toContain('죽은 코드 지우기')

  // 진행 중에는 새 작업을 시작하지 않는다
  expect(await call($, 'qef_start', { task: 'x', mode: 'extend', language: '한국어' })).toContain('이미 진행 중인 작업')
})

test('끝낼 때 판단 기록과 남긴 결함을 실행 기록에 남기고, 그 뒤에는 새로 시작할 수 있다', async ($, on) => {
  const { files, clock } = stubEngine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await call($, 'qef_start', { task: 't', mode: 'refactor', language: '한국어' })
  const dir = runDirOf(files)

  // 판단 기록 칸이 없으면 끝내지 않는다
  expect(await call($, 'qef_finish', { summary: '정리함' })).toContain('decisions')
  expect(await call($, 'qef_status')).toContain('작업: t')

  clock.now = 5
  const finished = await call($, 'qef_finish', {
    summary: '커밋 6개, 기준선과 같음',
    decisions: ['연결되지 않은 파서를 지움'],
    unverified: ['서버를 DB와 함께 띄우지 못함'],
    defects: ['0을 저장하면 값이 지워짐'],
  })
  expect(finished).toContain('작업을 끝냈다')
  expect(eventsOf(files, dir)[1]).toMatchObject({
    at: 5, kind: 'finish', summary: '커밋 6개, 기준선과 같음',
    decisions: ['연결되지 않은 파서를 지움'], unverified: ['서버를 DB와 함께 띄우지 못함'], defects: ['0을 저장하면 값이 지워짐'],
  })
  expect(await call($, 'qef_status')).toContain('진행 중인 qef 작업이 없다')

  clock.now = 2000
  expect(await call($, 'qef_start', { task: 'u', mode: 'extend', language: 'English' })).toContain('작업을 시작했다')
})
