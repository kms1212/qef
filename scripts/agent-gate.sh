#!/bin/sh
# Blocks Claude Code's built-in general agents, which work without qef's stage skills. A plugin cannot ship permission rules.
. "$(dirname "$0")/hook-lib.sh"

type=$(field subagent_type)
case "$type" in
  '' | general-purpose | Explore | Plan | claude) ;;
  *) exit 0 ;;
esac

reason="기본 agent ${type:-general-purpose}(subagent_type을 비우면 general-purpose)는 qef 스킬과 기준 없이 일하므로 막습니다. 이 일을 직접 가리키는 description의 agent를 고르고, 맞는 것이 없을 때만 qef:general을 씁니다(qef:execute의 「일을 나누는 방식」)."
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}' "$(printf '%s' "$reason" | json_escape)"
exit 0
