import type { ToolSpec } from 'claude-code'

// 모델이 부르는 도구
export const TOOL = {
  start: 'qef_start',
  status: 'qef_status',
  finish: 'qef_finish',
} as const

export const toolName = (name: string) => `mcp__qef__${name}`

/** tool.call 매처: 도구 이름이 타입에 없는 플러그인 도구라 정규식으로 맞춘다 */
export const toolMatcher = (name: string) => new RegExp(`^${toolName(name)}$`)

const stringList = (description: string) => ({ type: 'array', items: { type: 'string' }, description })

export const TOOL_SPECS: readonly ToolSpec[] = [
  {
    name: TOOL.start,
    description: '코드 변경 작업을 시작한다. 실행 폴더를 만들고 그 경로를 돌려준다. 진행 중인 작업이 있으면 시작하지 않는다.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: '사용자 요청 한 줄' },
        mode: { type: 'string', enum: ['build', 'extend', 'refactor'] },
        language: { type: 'string', description: '사용자가 이 대화에서 쓰는 언어 (예: 한국어, English). 사용자에게 하는 말을 이 언어로 쓴다.' },
      },
      required: ['task', 'mode', 'language'],
    },
    isDeferred: false,
  },
  {
    name: TOOL.status,
    description: '진행 중인 작업, 실행 폴더, 할 일 목록(ledger.md)을 돌려준다.',
    inputSchema: { type: 'object', properties: {} },
    isDeferred: false,
  },
  {
    name: TOOL.finish,
    description: '작업을 끝내고, 끝에 사용자에게 보일 내용을 실행 기록에 남긴다.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: '바뀐 것과 기준선과 비교한 동작 확인 결과 (작업 언어로, 몇 줄)' },
        decisions: stringList('혼자 정한 것과 감수한 것. 없으면 []'),
        unverified: stringList('확인하지 못한 것. 없으면 []'),
        defects: stringList('고치지 않고 남긴 결함과 보류한 단위. 없으면 []'),
      },
      required: ['summary', 'decisions', 'unverified', 'defects'],
    },
    isDeferred: false,
  },
]
