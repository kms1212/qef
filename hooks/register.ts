import type { Register } from 'claude-code'

import { COMMAND, COMMAND_SPECS, isPersonOrigin } from './commands/userCommands'
import { WRITE_TOOL_MATCHER, WRITE_TOOLS, denyWrite } from './guard/writeGuard'
import { stageSection } from './prompt/stageSection'
import {
  addPlannedFile, approveStage, readRun, reopenStage, resetRun, startRun, submitStage, toggleTestRevision,
} from './run/runState'
import { stageById } from './run/stages'
import { TOOL, TOOL_SPECS, toolMatcher } from './tools/modelTools'
import { PANE_ID, PANE_TITLE, drawPane } from './ui/progressPane'

// 진입점: 이벤트를 각 파일의 처리 함수에 연결만 한다.
export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    for (const spec of TOOL_SPECS) await $.tool.register(spec)
    for (const spec of COMMAND_SPECS) await $.command.register(spec)
    if (await readRun($)) void $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    return next(e)
  })

  // ---- 모델 도구 ----
  on('tool.call', { tool: toolMatcher(TOOL.start) }, async ($, e) => {
    const input = e as unknown as { task: string; mode: 'build' | 'extend' | 'refactor'; language?: string }
    const text = await startRun($, input.task, input.mode, input.language)
    void $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    return { result: text }
  })

  on('tool.call', { tool: toolMatcher(TOOL.status) }, async ($) => {
    const run = await readRun($)
    if (!run) return { result: '진행 중인 qef 작업이 없다.' }
    return { result: `${stageSection(run)}\n\n파일 트리:\n${JSON.stringify(run.files, null, 2)}` }
  })

  on('tool.call', { tool: toolMatcher(TOOL.submit) }, async ($, e) => {
    const input = e as unknown as {
      summary: string; artifact?: Record<string, unknown>; nextComponent?: boolean; deviations?: unknown
    }
    return { result: await submitStage($, input.summary, input.artifact, !!input.nextComponent, input.deviations) }
  })

  on('tool.call', { tool: toolMatcher(TOOL.addFile) }, async ($, e) => {
    return { result: await addPlannedFile($, e as unknown as Record<string, unknown>) }
  })

  on('tool.call', { tool: toolMatcher(TOOL.testRevision) }, async ($, e) => {
    const input = e as unknown as { action: string; reason?: string }
    return { result: await toggleTestRevision($, input.action, input.reason ?? '') }
  })

  on('tool.call', { tool: toolMatcher(TOOL.reopen) }, async ($, e) => {
    const input = e as unknown as { reason?: string }
    return { result: await reopenStage($, input.reason ?? '') }
  })

  // ---- 단계별 쓰기 제한 ----
  // 실제로 막는 것은 설정 파일의 샌드박스와 Edit 거부 규칙이다 (셸 포함, 서브에이전트 포함).
  // 이 훅은 그 앞에서 왜 막혔는지를 qef의 말로 알려 준다.
  on('tool.call', { tool: WRITE_TOOL_MATCHER }, async ($, e, next) => {
    const run = await readRun($)
    const field = WRITE_TOOLS[e.tool]
    const path = field ? (e as unknown as Record<string, unknown>)[field] : undefined
    const reason = run && run.status !== 'done' && typeof path === 'string' ? denyWrite(run, path) : undefined
    return reason ? { deny: reason } : next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'qef: 쓰기 제한 검사에 실패해 막았다.' }))

  // ---- 매 턴 현재 단계 안내 ----
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const run = await readRun($)
    if (!run || run.status === 'done') return composed
    return { sections: [...composed.sections, { id: 'qef:stage', text: stageSection(run), scope: 'session' }] }
  })

  // ---- 사용자 명령 ----
  on('command.run', { command: COMMAND.pane }, async ($) => {
    await $.ui.open({ id: PANE_ID, title: PANE_TITLE })
    return { text: 'qef 진행 패널을 열었다.' }
  })

  on('command.run', { command: COMMAND.approve }, async ($, e) => {
    if (!isPersonOrigin(e)) return { text: 'qef: 승인은 사용자가 직접 입력해야 한다.' }
    const text = await approveStage($)
    return { text, context: [text] }
  })

  on('command.run', { command: COMMAND.reset }, async ($, e) => {
    if (!isPersonOrigin(e)) return { text: 'qef: 작업 종료는 사용자가 직접 입력해야 한다.' }
    const text = await resetRun($)
    return { text, context: [text] }
  })

  // ---- 진행 패널 ----
  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => {
    const run = await readRun($)
    return drawPane($, e, run, async () => {
      const text = await approveStage($)
      $.ui.toast(text)
      const after = await readRun($)
      // 승인 사실을 모델이 다음 턴에 알도록 대화에 남긴다.
      await $.prompt.submit({ text: `[qef] 사용자가 승인했다: ${text} 현재 단계: ${after ? stageById(after.stage)?.label : '없음'}` })
    })
  })
}
