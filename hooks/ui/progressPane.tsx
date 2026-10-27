import type { EngineInterface, RenderInput } from 'claude-code'

import type { Run } from '../../types'
import { STAGES, stageById } from '../run/stages'

export const PANE_ID = 'qef-progress'
export const PANE_TITLE = 'qef 진행'

function mark(run: Run, index: number, current: number): string {
  if (run.status === 'done' || index < current) return '✓'
  if (index > current) return '·'
  return run.status === 'awaiting-approval' ? '⏸' : '▶'
}

/**
 * 단계에서 일한 시간(들어간 때부터 그 방문의 마지막 제출까지, 승인 대기는 빼고)과 제출에 적힌 어긋남 수.
 * 나머지 컴포넌트처럼 여러 번 들어간 단계는 방문마다 더한다.
 */
function stageStats(run: Run, stageId: string): { minutes: number | null; deviations: number } {
  const log = run.stageLog ?? []
  let worked = 0
  let seen = false
  log.forEach((visit, i) => {
    if (visit.stage !== stageId) return
    const end = log[i + 1]?.at ?? Infinity
    const subs = run.submissions.filter((s) => s.stage === stageId && s.at >= visit.at && s.at <= end)
    const last = subs[subs.length - 1]
    if (!last) return
    worked += last.at - visit.at
    seen = true
  })
  const deviations = run.submissions
    .filter((s) => s.stage === stageId)
    .reduce((n, s) => n + (s.deviations?.length ?? 0), 0)
  return { minutes: seen ? Math.max(1, Math.round(worked / 60000)) : null, deviations }
}

function statsText(run: Run, stageId: string): string {
  const { minutes, deviations } = stageStats(run, stageId)
  const parts = [minutes !== null ? `${minutes}분` : '', deviations ? `어긋남 ${deviations}` : ''].filter(Boolean)
  return parts.length ? `  ${parts.join(' · ')}` : ''
}

/** 진행 패널: 단계 목록, 현재 할 일, 마지막 제출 요약, 구현 중 추가된 파일, 승인 버튼 */
export function drawPane($: EngineInterface, e: RenderInput, run: Run | null, onApprove: () => Promise<unknown>) {
  const { Box, Text, Button } = $.ui.resolve(e)

  if (!run) {
    return (
      <Box flexDirection="column">
        <Text dimColor>진행 중인 qef 작업이 없다.</Text>
      </Box>
    )
  }

  const current = STAGES.findIndex((s) => s.id === (run.testRevision?.returnTo ?? run.stage))
  const last = run.submissions[run.submissions.length - 1]
  const added = run.files.filter((f) => f.addedLater)

  return (
    <Box flexDirection="column">
      <Text bold>{run.task}</Text>
      <Text dimColor>모드: {run.mode}</Text>
      {run.status !== 'done' && (
        run.settingsWarning
          ? <Text color="red">쓰기 제한을 넣지 못함: {run.settingsWarning}</Text>
          : <Text dimColor>샌드박스 켜짐 · 쓰기 거부 규칙 {run.settings?.rules.length ?? 0}개</Text>
      )}
      <Text> </Text>
      {STAGES.map((s, i) => (
        <Text dimColor={i !== current}>
          {mark(run, i, current)} {s.label}{s.gateAfter ? ' [체크포인트]' : ''}{statsText(run, s.id)}
        </Text>
      ))}
      {run.reopened && <Text>  ↳ 지적 반영 {run.reopened.round}차: {run.reopened.reason}</Text>}
      {run.testRevision && <Text>  ↳ 테스트 보완 중: {run.testRevision.reason}</Text>}
      <Text> </Text>
      {run.status === 'awaiting-approval' && (
        <Box flexDirection="column">
          <Text bold>승인 대기: {stageById(run.stage)?.label}</Text>
          {last && <Text>{last.summary}</Text>}
          <Button key="approve" variant="primary" label="승인하고 다음 단계로" onPress={onApprove} />
          <Text dimColor>지적이 있으면 대화로 말한다. 입력창에 /qef-approve 를 쳐도 승인된다.</Text>
        </Box>
      )}
      {run.status === 'working' && last && (
        <Box flexDirection="column">
          <Text dimColor>마지막 제출 ({stageById(last.stage)?.label}):</Text>
          <Text dimColor>{last.summary}</Text>
        </Box>
      )}
      {run.status === 'done' && <Text bold>작업이 끝났다.</Text>}
      {last?.deviations && last.deviations.length > 0 && (
        <Box flexDirection="column">
          <Text> </Text>
          <Text bold>지시와 다르게 한 것 ({stageById(last.stage)?.label})</Text>
          {last.deviations.map((d) => <Text>- {d}</Text>)}
        </Box>
      )}
      {added.length > 0 && (
        <Box flexDirection="column">
          <Text> </Text>
          <Text bold>구현 중 추가된 파일</Text>
          {added.map((f) => (
            <Text>
              {f.path} ({f.role}): {f.addedLater?.reason}
            </Text>
          ))}
        </Box>
      )}
      {run.runDir && (
        <Box flexDirection="column">
          <Text> </Text>
          <Text dimColor>실행 폴더: {run.runDir}</Text>
        </Box>
      )}
    </Box>
  )
}
