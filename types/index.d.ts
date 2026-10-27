/** 실행 폴더의 events.jsonl 한 줄. mod만 쓴다. */
export type RunEvent = {
  at: number
  kind: 'start' | 'finish'
  summary: string
  /** finish: 혼자 정한 것과 감수한 것 */
  decisions?: string[]
  /** finish: 확인하지 못한 것 */
  unverified?: string[]
  /** finish: 고치지 않고 남긴 결함 */
  defects?: string[]
}

/** 진행 중인 qef 작업 하나 */
export type Run = {
  task: string
  mode: 'build' | 'extend' | 'refactor'
  /** 프로젝트 루트(세션 작업 폴더), 끝에 / 없음 */
  root: string
  /** mod가 만든 실행 폴더의 절대 경로, 끝에 / 없음 */
  runDir: string
  /** 사용자가 쓰는 언어 (qef_start에서 받음) */
  language: string
  startedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    qef: { run: Run | null }
  }
}
