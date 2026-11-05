#!/bin/sh
# Re-injects the entry skill body after compaction and /clear, only in sessions that invoked it.
# /clear starts a new transcript, so SessionEnd leaves a mark that the next SessionStart in the same folder picks up.
input=$(cat)
field() { printf '%s' "$input" | sed -n "s/.*\"$1\":\"\\([^\"]*\\)\".*/\\1/p"; }
scripts="${CLAUDE_PLUGIN_ROOT}/scripts"
mark="${CLAUDE_PLUGIN_DATA}/cleared-$(field cwd | cksum | cut -d' ' -f1)"

case "$(field hook_event_name)" in
  SessionEnd)
    "$scripts/workflow-invoked.sh" "$(field transcript_path)" || exit 0
    mkdir -p "$CLAUDE_PLUGIN_DATA" && : > "$mark"
    exit 0
    ;;
esac

if [ "$(field source)" = clear ]; then
  [ -n "$(find "$mark" -mmin -1 2>/dev/null)" ] || { rm -f "$mark"; exit 0; }
  rm -f "$mark"
else
  "$scripts/workflow-invoked.sh" "$(field transcript_path)" || exit 0
fi

printf '이 세션은 qef:workflow를 지정해 진행 중입니다. 아래는 그 스킬 본문입니다.\n\n'
awk 'n>=2 {print} /^---$/ {n++}' "${CLAUDE_PLUGIN_ROOT}/skills/workflow/SKILL.md"
