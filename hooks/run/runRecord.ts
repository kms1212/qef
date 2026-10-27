import type { EngineInterface as Api } from 'claude-code'

import type { Run, RunEvent } from '../../types'

// 실행 기록은 mod가 직접 만들고 남긴다. 관찰하는 세션 없이도 시작과 끝, 끝에 보고한 판단을 실행 폴더만 보고 알 수 있게 하기 위해서다.

export const EVENTS_FILE = 'events.jsonl'
export const LEDGER_FILE = 'ledger.md'

const pad = (n: number) => String(n).padStart(2, '0')

function stamp(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** `~/.qef/runs/<프로젝트 루트의 /를 -로>/<시작 시각>/`을 만든다. 홈 경로를 얻지 못하면 그 이유를 돌려준다. */
export async function createRunDir($: Api, root: string, at: number): Promise<{ dir: string } | { error: string }> {
  const { exitCode, stdout } = await $.process.run(['printenv', 'HOME'])
  const home = stdout.trim().replace(/\/+$/, '')
  if (exitCode !== 0 || !home.startsWith('/')) return { error: '홈 경로(HOME)를 얻지 못해 실행 폴더를 만들 수 없다.' }
  const dir = `${home}/.qef/runs/${root.replaceAll('/', '-')}/${stamp(at)}`
  await $.fs.write(`${dir}/${EVENTS_FILE}`, '')
  return { dir }
}

/** events.jsonl에 한 줄을 붙인다 */
export async function appendEvent($: Api, run: Run, event: RunEvent): Promise<void> {
  const path = `${run.runDir}/${EVENTS_FILE}`
  const before = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
  await $.fs.write(path, `${before}${JSON.stringify(event)}\n`)
}

/** 실행 폴더의 할 일 목록. 아직 없으면 null */
export async function readLedger($: Api, run: Run): Promise<string | null> {
  const path = `${run.runDir}/${LEDGER_FILE}`
  return (await $.fs.exists(path)) ? await $.fs.read(path) : null
}
