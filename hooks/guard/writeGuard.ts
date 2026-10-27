import type { PlannedFile, Run, WritePolicy } from '../../types'
import { stageById } from '../run/stages'

/** 파일을 쓰는 도구와, 입력에서 대상 경로를 꺼내는 필드 */
export const WRITE_TOOLS: Record<string, string> = {
  Edit: 'file_path',
  MultiEdit: 'file_path',
  Write: 'file_path',
  NotebookEdit: 'notebook_path',
}

export const WRITE_TOOL_MATCHER = /^(Edit|MultiEdit|Write|NotebookEdit)$/

export const ALLOWED_ROLES: Record<WritePolicy, ReadonlySet<PlannedFile['role']>> = {
  none: new Set(),
  tests: new Set(['test']),
  impl: new Set(['impl', 'doc', 'build']),
  'tests+impl': new Set(['test', 'impl', 'doc', 'build']),
}

/** "."·".." 를 접어 정규화한 절대 경로 */
function normalize(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return '/' + out.join('/')
}

/** 쓰기를 막아야 하면 이유를, 아니면 undefined를 돌려준다. 프로젝트 밖 경로는 막지 않는다. */
export function denyWrite(run: Run, rawPath: string): string | undefined {
  const abs = normalize(rawPath.startsWith('/') ? rawPath : `${run.root}/${rawPath}`)
  if (abs !== run.root && !abs.startsWith(run.root + '/')) return undefined
  const rel = abs.slice(run.root.length + 1)
  const stage = stageById(run.stage)
  if (!stage) return `qef: 알 수 없는 단계(${run.stage})라 쓰기를 막았다.`

  if (run.status === 'awaiting-approval') {
    return `qef: "${stage.label}" 체크포인트에서 사용자 승인을 기다리는 중이라 파일을 쓸 수 없다.`
  }
  if (stage.writes === 'none') {
    return `qef: "${stage.label}" 단계에서는 프로젝트 파일을 쓸 수 없다 (${rel}).`
  }
  const planned = run.files.find((f) => f.path === rel)
  if (!planned) {
    return `qef: ${rel}은(는) 설계 파일 트리에 없다. 정말 필요하면 mcp__qef__qef_add_file로 경로·역할·책임·이유를 등록한 뒤 쓴다.`
  }
  if (!ALLOWED_ROLES[stage.writes].has(planned.role)) {
    const hint = planned.role === 'test'
      ? '테스트가 틀렸다고 보면 mcp__qef__qef_test_revision action=enter로 테스트 보완에 들어간다.'
      : '구현은 구현 단계에서 쓴다.'
    return `qef: "${stage.label}" 단계에서는 ${planned.role} 파일(${rel})을 쓸 수 없다. ${hint}`
  }
  return undefined
}
