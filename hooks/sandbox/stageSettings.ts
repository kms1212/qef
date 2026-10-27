import type { EngineInterface as Api } from 'claude-code'

import type { AppliedSettings, Run } from '../../types'
import { ALLOWED_ROLES } from '../guard/writeGuard'
import { stageById } from '../run/stages'

// 단계별 쓰기 규칙을 Claude Code의 샌드박스와 Edit 거부 규칙으로 옮긴다.
// Edit 거부 규칙은 Write/Edit 도구와 샌드박스 안의 셸 쓰기를 함께 막는다.
// mod 훅으로 설정 병합에 얹는 길은 엔진이 따르지 않아서, 설정 파일에 직접 쓴다.

const SETTINGS_FILE = '.claude/settings.local.json'
/** 실행 기록 폴더. 프로젝트 밖이라 샌드박스 쓰기 허용에 넣는다. */
const RUN_RECORDS = '~/.qef'
/** 설정 파일을 쓴 뒤 엔진이 다시 읽기까지 기다리는 한도 (시험에서는 약 1초) */
const RELOAD_TIMEOUT_MS = 5000

type Json = Record<string, unknown>

/** qef가 작업 동안 얹는 샌드박스. 네트워크는 전부 허용하고, 샌드박스 밖 실행은 막는다. */
function qefSandbox(before: unknown): Json {
  const base = (before && typeof before === 'object' ? before : {}) as Json
  const fs = (base.filesystem && typeof base.filesystem === 'object' ? base.filesystem : {}) as Json
  const allowWrite = Array.isArray(fs.allowWrite) ? fs.allowWrite.filter((p) => p !== RUN_RECORDS) : []
  return {
    ...base,
    enabled: true,
    autoAllowBashIfSandboxed: true,
    failIfUnavailable: true,
    allowUnsandboxedCommands: false,
    network: { ...((base.network as Json | undefined) ?? {}), allowedDomains: ['*'] },
    filesystem: { ...fs, allowWrite: [...allowWrite, RUN_RECORDS] },
  }
}

/** 경로를 권한 규칙의 패턴 문자로 읽히지 않게 한다 (Next.js의 [id] 같은 경로) */
const escapePattern = (path: string) => path.replace(/[\\*?[\]]/g, (c) => `\\${c}`)

/** 지금 단계에서 막을 Edit 규칙. 끝난 작업은 없다. */
export function denyRules(run: Run): string[] {
  if (run.status === 'done') return []
  const stage = stageById(run.stage)
  if (run.status === 'awaiting-approval' || !stage || stage.writes === 'none') return ['Edit(/**)']
  const allowed = ALLOWED_ROLES[stage.writes]
  return run.files.filter((f) => !allowed.has(f.role)).map((f) => `Edit(/${escapePattern(f.path)})`)
}

const denyOf = (settings: unknown): string[] => {
  const permissions = (settings as Json | undefined)?.permissions as Json | undefined
  return Array.isArray(permissions?.deny) ? (permissions.deny as string[]) : []
}

/** 엔진이 새 규칙을 읽을 때까지 기다린다. 기다리지 않으면 바로 다음 명령이 이전 규칙으로 돈다. */
async function waitForReload($: Api, present: string[], absent: string[]): Promise<boolean> {
  const t0 = Date.now()
  while (Date.now() - t0 < RELOAD_TIMEOUT_MS) {
    const deny = denyOf(await $.settings.read())
    if (present.every((r) => deny.includes(r)) && absent.every((r) => !deny.includes(r))) return true
    await $.clock.sleep(100)
  }
  return false
}

export type SyncResult = { applied: AppliedSettings | null; warning: string | null }

/**
 * 작업 상태에 맞게 설정 파일의 샌드박스와 거부 규칙을 맞춘다.
 * run이 없거나 끝났으면 qef가 넣은 것만 되돌린다. 사용자가 원래 둔 값은 건드리지 않는다.
 */
export async function syncSettings($: Api, root: string, run: Run | null, applied: AppliedSettings | null): Promise<SyncResult> {
  const path = `${root}/${SETTINGS_FILE}`
  let current: Json = {}
  try {
    if (await $.fs.exists(path)) current = JSON.parse(await $.fs.read(path)) as Json
  } catch {
    return { applied, warning: `${SETTINGS_FILE}을(를) 읽지 못해 샌드박스·쓰기 규칙을 넣지 못했다. 파일의 JSON을 고쳐야 한다.` }
  }

  const ours = applied?.rules ?? []
  const userDeny = denyOf(current).filter((r) => !ours.includes(r))
  const active = run && run.status !== 'done'
  const rules = active ? denyRules(run) : []
  const hadSandbox = applied ? applied.hadSandbox : 'sandbox' in current
  const sandboxBefore = applied ? applied.sandboxBefore : current.sandbox

  const next: Json = { ...current }
  if (active) next.sandbox = qefSandbox(sandboxBefore)
  else if (applied) {
    if (hadSandbox) next.sandbox = sandboxBefore
    else delete next.sandbox
  }
  const deny = [...userDeny, ...rules]
  if ('permissions' in current || deny.length) {
    next.permissions = { ...((current.permissions as Json | undefined) ?? {}), deny }
  }

  const result: AppliedSettings | null = active ? { rules, sandboxBefore, hadSandbox } : null
  if (JSON.stringify(next) === JSON.stringify(current)) return { applied: result, warning: null }

  await $.fs.write(path, `${JSON.stringify(next, null, 2)}\n`)
  const removed = ours.filter((r) => !rules.includes(r))
  const reloaded = await waitForReload($, rules, removed)
  return {
    applied: result,
    warning: reloaded ? null : `${SETTINGS_FILE}을(를) 고쳤지만 ${RELOAD_TIMEOUT_MS / 1000}초 안에 엔진이 다시 읽지 않았다.`,
  }
}
