/** 단계가 프로젝트 안에 쓸 수 있는 파일 */
export type WritePolicy = 'none' | 'tests' | 'impl' | 'tests+impl'

/** 설계 파일 트리의 파일 역할 */
export type FileRole = 'test' | 'impl' | 'doc' | 'build'

/** 설계가 정한 파일 하나 (경로는 프로젝트 루트 기준) */
export type PlannedFile = {
  path: string
  role: FileRole
  responsibility: string
  /** 구현 중 추가된 파일이면 그 단계와 이유 */
  addedLater?: { stage: string; reason: string }
}

/**
 * 모델이 단계를 마치며 제출한 요약. 체크포인트 지적을 반영한 뒤의 재제출이면 그 지적 요약이 붙는다.
 * deviations는 그 단계에서 지시와 다르게 한 것·막힌 것·우회한 것이다 (이전 버전 상태에는 없을 수 있다).
 */
export type Submission = { stage: string; summary: string; at: number; revisedFor?: string; deviations?: string[] }

/** 실행 폴더의 events.jsonl 한 줄. mod만 쓴다. */
export type RunEvent = {
  at: number
  kind: 'start' | 'submit' | 'approve' | 'reopen' | 'test-revision-enter' | 'test-revision-exit' | 'add-file' | 'reset'
  stage: string
  summary?: string
  deviations?: string[]
  reason?: string
}

/** 체크포인트 승인 대기를 풀고 사용자 지적을 반영하는 중인 상태 */
export type Reopened = { reason: string; at: number; round: number }

export type RunStatus = 'working' | 'awaiting-approval' | 'done'

/** qef가 .claude/settings.local.json에 넣은 것. 작업이 끝나면 이것만 되돌린다. */
export type AppliedSettings = {
  /** 지금 넣어 둔 Edit 거부 규칙 */
  rules: string[]
  /** qef가 넣기 전 sandbox 값 (없었으면 hadSandbox=false) */
  sandboxBefore: unknown
  hadSandbox: boolean
}

/** 진행 중인 qef 작업 하나 */
export type Run = {
  task: string
  mode: 'build' | 'extend' | 'refactor'
  /** 프로젝트 루트(세션 작업 폴더), 끝에 / 없음 */
  root: string
  stage: string
  status: RunStatus
  /** 구현 계열 단계에서 테스트를 고치러 잠깐 들어간 상태 */
  testRevision: { returnTo: string; reason: string } | null
  /** 체크포인트에서 사용자 지적을 반영하는 중이면 그 지적. 다시 제출하면 비워진다. 이전 버전 상태에는 없을 수 있다. */
  reopened?: Reopened | null
  requirements: unknown
  files: PlannedFile[]
  submissions: Submission[]
  approvals: { stage: string; at: number }[]
  /** 작업 시작 때 이미 바뀌어 있던 파일 (제출 검사에서 뺀다). 이전 버전 상태에는 없을 수 있다. */
  baseline?: string[]
  /** mod가 만든 실행 폴더의 절대 경로, 끝에 / 없음. 이전 버전 상태에는 없을 수 있다. */
  runDir?: string
  /** 사용자가 쓰는 언어 (qef_start에서 받음). 이전 버전 상태에는 없을 수 있다. */
  language?: string
  /** 단계에 들어간 순서와 시각. 마지막 항목이 현재 단계에 들어간 때다. 이전 버전 상태에는 없을 수 있다. */
  stageLog?: { stage: string; at: number }[]
  /** 설정 파일에 넣어 둔 샌드박스·거부 규칙 */
  settings?: AppliedSettings | null
  /** 설정을 넣지 못했을 때 그 이유 (패널과 안내에 보인다) */
  settingsWarning?: string | null
}

declare module 'claude-code' {
  interface PluginState {
    qef: { run: Run | null }
  }
}
