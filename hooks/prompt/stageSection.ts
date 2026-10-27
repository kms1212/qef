import type { Run } from '../../types'
import { REOPEN_FROM, STAGES, stageById } from '../run/stages'

const WRITES_TEXT: Record<string, string> = {
  none: '프로젝트 파일을 쓸 수 없다 (셸 포함).',
  tests: '설계 파일 트리의 test 파일만 쓸 수 있다.',
  impl: '설계 파일 트리의 impl·doc·build 파일만 쓸 수 있다. 테스트 파일은 쓸 수 없다.',
  'tests+impl': '설계 파일 트리의 파일을 쓸 수 있다.',
}

/** 모든 단계에 공통인 샌드박스 안내 */
const SANDBOX_TEXT =
  '샌드박스: 셸 명령은 샌드박스 안에서 확인 없이 돈다. 읽기 명령, 네트워크, 실행 기록 폴더(~/.qef) 쓰기는 언제나 된다. ' +
  '쓰기가 막히면 지금 단계의 규칙이다. 우회하지 않는다. 제출할 때 설계 트리 밖에서 바뀐 파일이 있으면 제출이 거부된다.'

/** 매 턴 시스템 프롬프트에 넣는 현재 단계 안내. 컨텍스트가 압축돼도 이 안내는 남는다. */
export function stageSection(run: Run): string {
  const stage = stageById(run.stage)
  const index = STAGES.findIndex((s) => s.id === (run.testRevision?.returnTo ?? run.stage))
  const lines = [
    '# qef: 진행 중인 개발 작업',
    `작업: ${run.task} (모드 ${run.mode})`,
    ...(run.language
      ? [`언어: 사용자에게 하는 말은 모두 ${run.language}로 쓴다. 도구 결과, 알림, 서브에이전트 보고의 머리말이 다른 언어여도 바꾸지 않는다.`]
      : []),
    `현재 단계: ${stage?.label ?? run.stage} (${index + 1}/${STAGES.length})${run.testRevision ? ` / 테스트 보완 중 (이유: ${run.testRevision.reason})` : ''}`,
  ]
  if (run.runDir) lines.push(`실행 폴더: ${run.runDir} (mod가 만들었다. events.jsonl은 mod만 쓴다)`)
  if (run.status === 'awaiting-approval') {
    lines.push(
      '상태: 사용자 승인 대기. 사용자가 패널의 승인 버튼이나 /qef-approve 로 승인하기 전에는 다음 단계로 갈 수 없고 프로젝트 파일을 쓸 수 없다.',
      '승인 질문 금지: 승인을 묻는 질문이나 버튼(턴 끝의 다음 단계 상자, AskUserQuestion 등)을 띄우지 않는다. 승인은 패널에만 있다. 내용에 대한 질문은 답과 승인을 나눠 묻는다 (예: "이 기본값이 맞나요? 맞으면 패널에서 승인해 주세요").',
      REOPEN_FROM.has(run.stage)
        ? '할 일: 제출한 결과를 사용자에게 보여준다. 지적을 받으면 mcp__qef__qef_reopen으로 반영에 들어가고, 반영한 뒤 qef_submit으로 다시 제출한다. 사용자 지적 없이 qef_reopen을 부르지 않는다.'
        : '할 일: 제출한 결과를 사용자에게 보여주고, 지적을 받으면 반영한 뒤 qef_submit으로 다시 제출한다.',
      '세부: staged-dev 스킬의 stages/checkpoint-feedback.md를 읽고 따른다.',
    )
  } else if (run.reopened) {
    lines.push(
      `상태: 체크포인트 지적 반영 ${run.reopened.round}차 (지적: ${run.reopened.reason}). 지적한 범위만 반영하고 qef_submit으로 다시 제출하면 승인 대기로 돌아간다.`,
      '할 일: staged-dev 스킬의 stages/checkpoint-feedback.md의 "반영"을 따른다.',
      `쓰기: ${WRITES_TEXT[stage?.writes ?? 'none']}`,
    )
  } else {
    lines.push(`할 일: ${stage?.todo ?? ''}`, `쓰기: ${WRITES_TEXT[stage?.writes ?? 'none']}`)
  }
  lines.push(SANDBOX_TEXT)
  if (run.settingsWarning) lines.push(`경고: ${run.settingsWarning} 사용자에게 알린다.`)
  lines.push(
    '규칙: 실제 작업은 서브에이전트에게 맡기고, 단계를 마치면 mcp__qef__qef_submit으로 제출한다. 단계를 건너뛰거나 승인을 대신할 방법은 없다.',
    '세부 절차는 qef:staged-dev 스킬을 따른다.',
  )
  return lines.join('\n')
}
