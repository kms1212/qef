import type { EngineInterface as Api } from 'claude-code'

import type { Run } from '../../types'

// 거부 규칙으로는 "트리 밖 새 파일"을 막을 수 없다 (허용·거부가 겹치면 거부가 이긴다).
// 그래서 단계를 제출할 때 git이 보는 변경이 모두 설계 트리 안에 있는지 확인한다.

/** qef가 직접 고치는 파일. 제출 검사에서 뺀다. */
const OWN_FILES = new Set(['.claude/settings.local.json'])

/** git status가 보는 변경된 경로 (.gitignore에 든 것은 빠진다). git 저장소가 아니면 null. */
export async function changedPaths($: Api, root: string): Promise<string[] | null> {
  const { exitCode, stdout } = await $.process.run(['git', 'status', '--porcelain=v1', '-z', '-uall'], { cwd: root })
  if (exitCode !== 0) return null
  const fields = stdout.split('\0')
  const paths: string[] = []
  for (let i = 0; i < fields.length; i++) {
    const entry = fields[i]!
    if (entry.length < 4) continue
    const status = entry.slice(0, 2)
    paths.push(entry.slice(3))
    // 이름 바꾸기·복사는 다음 필드가 원래 경로다
    if (status.includes('R') || status.includes('C')) i++
  }
  return paths
}

/** 설계 트리 밖에서 바뀐 파일. 작업 시작 전부터 바뀌어 있던 파일은 뺀다. */
export async function strayFiles($: Api, run: Run): Promise<string[] | null> {
  const paths = await changedPaths($, run.root)
  if (!paths) return null
  const planned = new Set(run.files.map((f) => f.path))
  const baseline = new Set(run.baseline ?? [])
  return paths.filter((p) => !planned.has(p) && !baseline.has(p) && !OWN_FILES.has(p))
}
