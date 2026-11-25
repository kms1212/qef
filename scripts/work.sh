#!/bin/sh
# Hands every session and subagent the qef work rules as context: SessionStart (start, resume, /clear, compaction)
# keeps them in the main conversation the way CLAUDE.md is kept, and SubagentStart gives subagents the same body.
. "$(dirname "$0")/hook-lib.sh"

body=$(awk 'n>=2 {print} /^---$/ {n++}' "$(dirname "$0")/../skills/work/SKILL.md")
printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}' "$(field hook_event_name)" "$(printf '%s' "$body" | json_escape)"
