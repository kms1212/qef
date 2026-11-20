#!/bin/sh
# In a session under qef:workflow, blocks writing a project file until the stage skills that the workflow table
# names for it were invoked after the last compaction. Prose files (.md, .tex, .txt, .rst) are left to project rules.
. "$(dirname "$0")/job-lib.sh"

[ -z "$agent" ] || exit 0
transcript=$(field transcript_path)
"$(dirname "$0")/workflow-invoked.sh" "$transcript" || exit 0

is_test() {
  case "/$1" in
    */test/* | */tests/* | */__tests__/*) return 0 ;;
  esac
  case "$(basename "$1")" in
    test_* | *_test.* | *.test.* | *.spec.* | conftest.py) return 0 ;;
  esac
  return 1
}

needed=qef:dev
if [ "$(field tool_name)" = Bash ]; then
  # A shell edit names no single file, so the common file-writing forms stand for writing code.
  command=$(printf '%s' "$input" | sed -nE 's/.*"command":"(([^"\\]|\\.)*)".*/\1/p')
  printf '%s' "$command" | grep -Eq '(^|[^[:alnum:]_])(sed|perl)[[:space:]]+(-[[:alnum:]]*[[:space:]]+)*-[[:alnum:]]*i|write_text\(|write_bytes\(|open\([^)]*[\\]?["'"'"'][wax]|(^|[^[:alnum:]_])tee[[:space:]]|cat[[:space:]]*>' || exit 0
  relative='셸 명령으로 쓰는'
  printf '%s' "$command" | grep -Eq '(^|/)(tests?|__tests__)/|test_[[:alnum:]_]*\.py|_test\.|\.test\.|\.spec\.' && needed="$needed qef:testing"
else
  path=$(field file_path)
  [ -n "$path" ] || path=$(field notebook_path)
  path=$(real_path "$path")
  case "$path" in
    "$qef"/*) exit 0 ;;
    "$root"/*) ;;
    *) exit 0 ;;
  esac
  case "$path" in
    *.md | *.tex | *.txt | *.rst) exit 0 ;;
  esac
  relative=${path#"$root"/}
  ! is_test "$relative" || needed="$needed qef:testing"
fi
if [ -f "$root/package.json" ] || [ -f "$root/tsconfig.json" ]; then
  needed="$needed qef:js-ts"
fi

missing=
for skill in $needed; do
  "$(dirname "$0")/skill-called.sh" "$transcript" "$skill" || missing="$missing $skill"
done
[ -n "$missing" ] || exit 0

reason="$relative 파일을 고치기 전에 qef:workflow의 단계 표가 가리키는 스킬을 Skill로 호출합니다:$missing. compaction 전에 호출했더라도 compaction 뒤에는 본문이 앞부분만 남거나 빠지므로 다시 호출합니다. Claude Code의 'Do NOT re-execute these skills' 안내는 이 호출을 막지 않습니다."
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}' "$(printf '%s' "$reason" | json_escape)"
exit 0
