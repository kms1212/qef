#!/bin/sh
# Injects the entry skill body: after compaction and /clear in sessions under it, and when another qef skill is called first.
# /clear starts a new transcript, so SessionEnd leaves a mark that the next SessionStart in the same folder picks up.
# The note line is what workflow-invoked.sh finds in the transcript afterwards.
input=$(cat)
field() { printf '%s' "$input" | sed -n "s/.*\"$1\":\"\\([^\"]*\\)\".*/\\1/p"; }
scripts="${CLAUDE_PLUGIN_ROOT}/scripts"
mark="${CLAUDE_PLUGIN_DATA}/cleared-$(field cwd | cksum | cut -d' ' -f1)"

body() {
  printf '이 세션은 qef:workflow로 진행 중입니다. 아래는 그 스킬 본문입니다.\n\n'
  awk 'n>=2 {print} /^---$/ {n++}' "${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md"
}

case "$(field hook_event_name)" in
  SessionEnd)
    "$scripts/workflow-invoked.sh" "$(field transcript_path)" || exit 0
    mkdir -p "$CLAUDE_PLUGIN_DATA" && : > "$mark"
    exit 0
    ;;
  PostToolUse)
    [ -z "$(field agent_id)" ] || exit 0
    case "$(field skill)" in
      qef:workflow) exit 0 ;;
      qef:*) ;;
      *) exit 0 ;;
    esac
    "$scripts/workflow-invoked.sh" "$(field transcript_path)" && exit 0
    job_input=$input
    . "$scripts/job-lib.sh"
    printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}' "$(body | json_escape)"
    exit 0
    ;;
esac

if [ "$(field source)" = clear ]; then
  [ -n "$(find "$mark" -mmin -1 2>/dev/null)" ] || { rm -f "$mark"; exit 0; }
  rm -f "$mark"
else
  "$scripts/workflow-invoked.sh" "$(field transcript_path)" || exit 0
fi

body

[ "$(field source)" = compact ] || exit 0
called=$(grep -o '"skill":"[^"]*"' "$(field transcript_path)" 2>/dev/null | sed 's/"skill":"\(.*\)"/\1/' | grep -vx 'qef:workflow' | sort -u | paste -sd, - | sed 's/,/, /g')
[ -z "$called" ] || printf '\ncompaction 전에 이 세션에서 호출한 스킬: %s. 이 스킬들이 맡는 일을 다시 할 때는 Skill로 다시 호출합니다.\n' "$called"
