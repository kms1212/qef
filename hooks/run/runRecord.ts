import type { EngineInterface as Api } from 'claude-code'

import type { Run, RunEvent } from '../../types'
import { requiredFiles } from './requiredFiles'

// 실행 기록은 mod가 직접 만들고 남긴다. 관찰하는 세션 없이도 진행과 어긋남을 실행 폴더만 보고 알 수 있게 하기 위해서다.

export const EVENTS_FILE = 'events.jsonl'

/** 파일 시각과 mod 시계가 조금 어긋나도 "이 단계에서 썼다"로 본다 */
const CLOCK_SLACK_MS = 2000

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

/** events.jsonl에 한 줄을 붙인다. 실행 폴더가 없는 이전 버전 상태면 건너뛴다. */
export async function appendEvent($: Api, run: Run | null, event: RunEvent): Promise<void> {
  if (!run?.runDir) return
  const path = `${run.runDir}/${EVENTS_FILE}`
  const before = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
  await $.fs.write(path, `${before}${JSON.stringify(event)}\n`)
}

/** 현재 단계에 들어간 시각 */
export const stageEnteredAt = (run: Run): number => run.stageLog?.[run.stageLog.length - 1]?.at ?? 0

function patternRegex(name: string): RegExp {
  const escaped = name.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')
  return new RegExp(`^${escaped}$`)
}

/** 이 단계의 필수 파일 중 이 단계에서 쓰인 것이 모자란 패턴. 실행 폴더가 없는 이전 버전 상태면 빈 목록이다. */
export async function missingFiles($: Api, run: Run, stage: string): Promise<string[]> {
  if (!run.runDir) return []
  const since = stageEnteredAt(run) - CLOCK_SLACK_MS
  const missing: string[] = []
  for (const req of requiredFiles(run, stage)) {
    const slash = req.pattern.lastIndexOf('/')
    const dir = slash < 0 ? run.runDir : `${run.runDir}/${req.pattern.slice(0, slash)}`
    const name = patternRegex(req.pattern.slice(slash + 1))
    const entries = (await $.fs.exists(dir)) ? await $.fs.list(dir) : []
    const fresh = entries.filter((e) => e.kind === 'file' && name.test(e.name) && e.mtimeMs >= since)
    if (fresh.length < req.min) missing.push(req.min > 1 ? `${req.pattern} (${req.min}개 이상)` : req.pattern)
  }
  return missing
}
