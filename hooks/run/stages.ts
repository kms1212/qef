import type { WritePolicy } from '../../types'

export type StageDef = {
  id: string
  label: string
  /** 이 단계에서 프로젝트 안에 쓸 수 있는 파일 */
  writes: WritePolicy
  /** 이 단계를 마치면 사용자 승인이 있어야 다음 단계로 간다 (체크포인트) */
  gateAfter: boolean
  /** 이 단계에서 모델이 할 일 (프롬프트에 매 턴 들어간다) */
  todo: string
}

// 단계 순서. 체크포인트(gateAfter)는 요구사항, 설계, 공통부, 전체 보완, 통합 테스트 뒤에만 있다.
export const STAGES: readonly StageDef[] = [
  {
    id: 'requirements', label: '요구사항 확정', writes: 'none', gateAfter: true,
    todo: 'staged-dev 스킬의 requirements.md대로 요구사항과 모드를 정해 사용자에게 보여주고, 끝나면 qef_submit에 artifact.requirements로 제출한다.',
  },
  {
    id: 'design', label: '구조 설계·검토', writes: 'none', gateAfter: true,
    todo: 'staged-dev 스킬의 stages/design.md를 읽고 따른다. 조사·설계·구조 검토를 서브에이전트로 진행하고, 끝나면 qef_submit에 artifact.files(경로·역할·책임)로 파일 트리를 제출한다.',
  },
  {
    id: 'common-tests', label: '공통부 테스트 작성', writes: 'tests', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/write-tests.md를 읽고 따른다. 공통부 테스트를 서브에이전트로 작성한다. 구현 파일은 쓸 수 없다.',
  },
  {
    id: 'common-impl', label: '공통부 구현', writes: 'impl', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/implement.md를 읽고 따른다. 공통부를 구현한다. 테스트 파일은 쓸 수 없다. 테스트가 틀렸다고 보면 qef_test_revision으로 테스트 보완에 들어간다.',
  },
  {
    id: 'common-review', label: '공통부 구조 검토', writes: 'none', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/review.md를 읽고 따른다. 공통부를 서브에이전트로 검토한다 (관점별 검토, 재발명 탐지, 경로 예측 대조). 파일은 쓸 수 없다.',
  },
  {
    id: 'common-fix', label: '공통부 구조 보완', writes: 'impl', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/implement.md를 읽고 따른다. 검토 지적을 반영한다. 테스트 파일은 쓸 수 없다.',
  },
  {
    id: 'common-verify', label: '공통부 테스트 실행', writes: 'impl', gateAfter: true,
    todo: 'staged-dev 스킬의 stages/run-tests.md를 읽고 따른다. 공통부 테스트를 돌리고 실패를 고친다. 통과하면 결과를 제출한다.',
  },
  {
    id: 'rest-tests', label: '나머지 테스트 작성', writes: 'tests', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/write-tests.md를 읽고 따른다. 다음 컴포넌트의 테스트를 작성한다. 구현 파일은 쓸 수 없다.',
  },
  {
    id: 'rest-impl', label: '나머지 구현', writes: 'impl', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/implement.md를 읽고 따른다. 그 컴포넌트를 구현한다. 남은 컴포넌트가 있으면 qef_submit의 nextComponent=true로 테스트 작성으로 돌아간다.',
  },
  {
    id: 'rest-verify', label: '나머지 테스트 실행', writes: 'impl', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/run-tests.md를 읽고 따른다. 전체 단위 테스트를 돌리고 실패를 고친다.',
  },
  {
    id: 'full-review', label: '전체 구조 검토', writes: 'none', gateAfter: false,
    todo: 'staged-dev 스킬의 stages/review.md를 읽고 따른다. 바뀐 코드 전체를 서브에이전트로 검토한다. 파일은 쓸 수 없다.',
  },
  {
    id: 'full-fix', label: '전체 구조 보완', writes: 'impl', gateAfter: true,
    todo: 'staged-dev 스킬의 stages/implement.md를 읽고 따른다. blocker/major 지적을 반영하고 단위 테스트가 통과하는지 확인한다.',
  },
  {
    id: 'integration', label: '전체 통합 테스트', writes: 'tests+impl', gateAfter: true,
    todo: 'staged-dev 스킬의 stages/integration.md를 읽고 따른다. 수용 기준마다 통합 테스트를 작성·실행하고 실패를 고친다.',
  },
]

/** 구현 계열 단계에서 테스트를 고치러 잠깐 들어가는 상태 */
export const TEST_REVISION: StageDef = {
  id: 'test-revision', label: '테스트 보완', writes: 'tests', gateAfter: false,
  todo: 'staged-dev 스킬의 stages/test-revision.md를 읽고 따른다. 테스트가 요구사항·테스트 기준과 맞는지 판정하고, 틀린 테스트만 고친다. 끝나면 qef_test_revision action=exit로 돌아간다.',
}

/** 테스트 보완에 들어갈 수 있는 단계 */
export const TEST_REVISION_FROM: ReadonlySet<string> = new Set([
  'common-impl', 'common-fix', 'common-verify', 'rest-impl', 'rest-verify', 'full-fix', 'integration',
])

/** 승인 대기를 풀고 사용자 지적을 반영할 수 있는 체크포인트 (쓰기가 있는 단계만) */
export const REOPEN_FROM: ReadonlySet<string> = new Set(['common-verify', 'full-fix', 'integration'])

export const stageById =(id: string): StageDef | undefined =>
  id === TEST_REVISION.id ? TEST_REVISION : STAGES.find((s) => s.id === id)

export const nextStageId = (id: string): string | undefined => {
  const i = STAGES.findIndex((s) => s.id === id)
  return i >= 0 ? STAGES[i + 1]?.id : undefined
}
