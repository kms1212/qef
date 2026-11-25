#!/bin/sh
# Blocks writing a project file until the skills it needs were invoked after the last compaction:
# the stage skills of the qef table for code, and the skills the project's .claude/qef/required-skills names for matching paths.
# Prose files (.md, .tex, .txt, .rst) need no stage skill; required-skills can still name one for them.
. "$(dirname "$0")/job-lib.sh"

[ -z "$agent" ] || exit 0
transcript=$(field transcript_path)

is_test() {
  case "/$1" in
    */test/* | */tests/* | */__tests__/*) return 0 ;;
  esac
  case "$(basename "$1")" in
    test_* | *_test.* | *.test.* | *.spec.* | conftest.py) return 0 ;;
  esac
  return 1
}

# Lines are `skill<TAB>extended regex on the repository-relative path`; blank lines and # comments are skipped.
required() {
  [ -f "$root/.claude/qef/required-skills" ] || return 0
  grep -Ev '^[[:space:]]*(#.*)?$' "$root/.claude/qef/required-skills" | while IFS="$(printf '\t')" read -r skill pattern; do
    printf '%s\n' "$@" | grep -Eq -- "$pattern" && printf ' %s' "$skill"
  done
}

needed=
if [ "$(field tool_name)" = Bash ]; then
  # A shell edit names no single file, so the common file-writing forms stand for writing code.
  command=$(command_field)
  printf '%s' "$command" | grep -Eq '(^|[^[:alnum:]_])(sed|perl)[[:space:]]+(-[[:alnum:]]*[[:space:]]+)*-[[:alnum:]]*i|write_text\(|write_bytes\(|open\([^)]*[\\]?["'"'"'][wax]|(^|[^[:alnum:]_])tee[[:space:]]|cat[[:space:]]*>' || exit 0
  relative='셸 명령으로 쓰는'
  needed=qef:dev
  printf '%s' "$command" | grep -Eq '(^|/)(tests?|__tests__)/|test_[[:alnum:]_]*\.py|_test\.|\.test\.|\.spec\.' && needed="$needed qef:testing"
  needed="$needed$(required $(printf '%s' "$command" | grep -oE '[[:alnum:]_./-]+'))"
else
  path=$(field file_path)
  [ -n "$path" ] || path=$(field notebook_path)
  path=$(real_path "$path")
  case "$path" in
    "$qef"/*) exit 0 ;;
    "$root"/*) ;;
    *) exit 0 ;;
  esac
  relative=${path#"$root"/}
  case "$path" in
    *.md | *.tex | *.txt | *.rst) ;;
    *)
      needed=qef:dev
      ! is_test "$relative" || needed="$needed qef:testing"
      ;;
  esac
  needed="$needed$(required "$relative")"
fi
if [ -n "$needed" ] && { [ -f "$root/package.json" ] || [ -f "$root/tsconfig.json" ]; }; then
  case " $needed " in *' qef:dev '*) needed="$needed qef:js-ts" ;; esac
fi

missing=
for skill in $needed; do
  case " $missing " in *" $skill "*) continue ;; esac
  "$(dirname "$0")/skill-called.sh" "$transcript" "$skill" || missing="$missing $skill"
done
[ -n "$missing" ] || exit 0

reason="$relative 파일을 고치기 전에 스킬을 Skill로 호출하고, 그 본문의 절차를 처음부터 끝까지 따릅니다:$missing. qef 규칙의 「단계 → 스킬」 표와 프로젝트의 .claude/qef/required-skills가 정한 스킬입니다. compaction 전에 호출했더라도 compaction 뒤에는 본문이 앞부분만 남거나 빠지므로 다시 호출합니다. Claude Code의 'Do NOT re-execute these skills' 안내는 이 호출을 막지 않습니다."
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}' "$(printf '%s' "$reason" | json_escape)"
exit 0
