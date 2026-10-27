import type { Register } from 'claude-code'

import { runSection } from './prompt/runSection'
import { readLedger } from './run/runRecord'
import { finishRun, readRun, startRun } from './run/runState'
import { TOOL, TOOL_SPECS, toolMatcher } from './tools/modelTools'

// 진입점: 이벤트를 각 파일의 처리 함수에 연결만 한다.
export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    for (const spec of TOOL_SPECS) await $.tool.register(spec)
    return next(e)
  })

  // ---- 모델 도구 ----
  on('tool.call', { tool: toolMatcher(TOOL.start) }, async ($, e) => {
    const input = e as unknown as Record<string, unknown>
    return { result: await startRun($, input.task, input.mode, input.language) }
  })

  on('tool.call', { tool: toolMatcher(TOOL.status) }, async ($) => {
    const run = await readRun($)
    if (!run) return { result: '진행 중인 qef 작업이 없다.' }
    const ledger = await readLedger($, run)
    return { result: `${runSection(run)}\n\n할 일 목록:\n${ledger ?? '(아직 없다)'}` }
  })

  on('tool.call', { tool: toolMatcher(TOOL.finish) }, async ($, e) => {
    const input = e as unknown as Record<string, unknown>
    return { result: await finishRun($, input.summary, input.decisions, input.unverified, input.defects) }
  })

  // ---- 매 턴 작업 안내 ----
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const run = await readRun($)
    if (!run) return composed
    return { sections: [...composed.sections, { id: 'qef:run', text: runSection(run), scope: 'session' }] }
  })
}
