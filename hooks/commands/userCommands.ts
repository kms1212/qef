import type { CommandRunInput } from 'claude-code'

export const COMMAND = {
  pane: 'qef',
  approve: 'qef-approve',
  reset: 'qef-reset',
} as const

export const COMMAND_SPECS = [
  { name: COMMAND.pane, description: 'qef 진행 패널을 연다' },
  { name: COMMAND.approve, description: 'qef 체크포인트를 승인하고 다음 단계로 넘어간다 (사용자만)' },
  { name: COMMAND.reset, description: '진행 중인 qef 작업을 끝낸다 (사용자만)' },
] as const

/**
 * 사용자가 직접 입력한 명령인지. 엔진이 붙이는 origin으로 판단한다.
 * 모델·다른 플러그인·알림·예약 실행에서 온 명령은 승인·종료를 할 수 없다.
 */
export const isPersonOrigin = (e: CommandRunInput) => {
  const kind = e.origin?.kind
  return kind === 'composer' || kind === 'bridge' || kind === 'sdk'
}
