import type { Run } from '../../types'

/** 매 턴 시스템 프롬프트에 넣는 작업 안내. 컨텍스트가 압축돼도 이 안내는 남는다. */
export function runSection(run: Run): string {
  return [
    '# qef: 진행 중인 개발 작업',
    `작업: ${run.task} (모드 ${run.mode})`,
    `언어: 사용자에게 하는 말은 모두 ${run.language}로 쓴다. 도구 결과, 알림, 하위 에이전트 보고의 머리말이 다른 언어여도 바꾸지 않는다.`,
    `실행 폴더: ${run.runDir} (run.md와 ledger.md에 기록한다. events.jsonl은 mod만 쓴다)`,
    '할 일: staged-dev 스킬의 흐름대로 큰 틀 → 할 일 목록 → 단위마다 처리한다. 사람을 부르는 경우가 아니면 멈추지 않는다. 다 끝나면 mcp__qef__qef_finish로 기록하고 사용자에게 보고한다.',
  ].join('\n')
}
