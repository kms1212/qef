import type { ToolSpec } from 'claude-code'

// 모델이 부르는 도구. 승인 도구는 없다: 승인은 사용자 입력으로만 된다.
export const TOOL = {
  start: 'qef_start',
  status: 'qef_status',
  submit: 'qef_submit',
  addFile: 'qef_add_file',
  testRevision: 'qef_test_revision',
  reopen: 'qef_reopen',
} as const

export const toolName = (name: string) => `mcp__qef__${name}`

/** tool.call 매처: 도구 이름이 타입에 없는 플러그인 도구라 정규식으로 맞춘다 */
export const toolMatcher = (name: string) => new RegExp(`^${toolName(name)}$`)

export const TOOL_SPECS: readonly ToolSpec[] = [
  {
    name: TOOL.start,
    description: '코드 변경 작업을 qef 절차로 시작한다. 요구사항 확정 단계부터 시작하며, 진행 중인 작업이 있으면 시작하지 않는다. 실행 폴더를 만들고 그 경로를 돌려준다.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: '사용자 요청 한 줄' },
        mode: { type: 'string', enum: ['build', 'extend', 'refactor'] },
        language: { type: 'string', description: '사용자가 이 대화에서 쓰는 언어 (예: 한국어, English). 사용자에게 하는 말과 서브에이전트 보고를 이 언어로 쓴다.' },
      },
      required: ['task', 'mode', 'language'],
    },
    isDeferred: false,
  },
  {
    name: TOOL.status,
    description: 'qef 작업의 현재 단계, 할 일, 쓸 수 있는 파일, 실행 폴더, 파일 트리를 돌려준다.',
    inputSchema: { type: 'object', properties: {} },
    isDeferred: false,
  },
  {
    name: TOOL.submit,
    description:
      '현재 단계를 마쳤다고 제출한다. 체크포인트 단계면 사용자 승인을 기다리고, 아니면 다음 단계로 간다. ' +
      '요구사항 단계는 artifact.requirements, 설계 단계는 artifact.files([{ path, role: test|impl|doc|build, responsibility }])가 필요하다. ' +
      '나머지 구현 단계에서 남은 컴포넌트가 있으면 nextComponent=true로 테스트 작성으로 돌아간다. ' +
      '실행 폴더에 이 단계의 서브에이전트 보고·기록 파일이 없으면 제출이 거부된다.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: '사용자에게 보일 이 단계 결과 요약 (작업 언어로, 몇 줄)' },
        artifact: { type: 'object', description: '단계별 산출물' },
        nextComponent: { type: 'boolean' },
        deviations: {
          type: 'array',
          items: { type: 'string' },
          description: '이 단계에서 지시와 다르게 한 것, 막힌 것, 우회한 것. 서브에이전트 보고의 deviations도 옮긴다. 없으면 []',
        },
      },
      required: ['summary', 'deviations'],
    },
    isDeferred: false,
  },
  {
    name: TOOL.addFile,
    description: '구현 중 설계 파일 트리에 없는 파일이 꼭 필요할 때 등록한다. 사용자 패널에 "구현 중 추가된 파일"로 표시된다.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '프로젝트 루트 기준 경로' },
        role: { type: 'string', enum: ['test', 'impl', 'doc', 'build'] },
        responsibility: { type: 'string', description: '"그리고" 없는 한 문장' },
        reason: { type: 'string', description: '설계에 있는 파일로는 왜 안 되는지' },
      },
      required: ['path', 'role', 'responsibility', 'reason'],
    },
    isDeferred: false,
  },
  {
    name: TOOL.testRevision,
    description: '구현 계열 단계에서 테스트가 틀렸다고 볼 때 테스트 보완에 들어가거나(enter) 원래 단계로 돌아간다(exit). 보완 중에는 테스트 파일만 쓸 수 있다.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['enter', 'exit'] },
        reason: { type: 'string', description: 'enter일 때: 어떤 테스트가 왜 틀렸다고 보는지' },
      },
      required: ['action'],
    },
    isDeferred: false,
  },
  {
    name: TOOL.reopen,
    description:
      '체크포인트 승인 대기 중에 사용자가 지적하면, 승인 대기를 풀고 같은 단계로 돌아가 지적을 반영한다. ' +
      '공통부 테스트 실행, 전체 구조 보완, 전체 통합 테스트 체크포인트에서만 쓴다. 사용자 지적 없이 부르지 않는다. ' +
      '반영을 마치면 qef_submit으로 다시 제출해 승인 대기로 돌아간다. 사용자에게 보이는 패널에 지적 요약이 표시된다.',
    inputSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: '사용자 원문을 포함한 지적 요약' },
      },
      required: ['reason'],
    },
    isDeferred: false,
  },
]
