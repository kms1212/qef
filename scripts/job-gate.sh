#!/bin/sh
# Blocks work under a job until its sources are read and the user has accepted its goal and structure.
. "$(dirname "$0")/job-lib.sh"

bound_job || exit 0

decide() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"%s","permissionDecisionReason":"%s"}}' "$1" "$(printf '%s' "$2" | json_escape)"
  exit 0
}

require_sources() {
  unread=$(unread_sources)
  [ -z "$unread" ] || decide deny "qef 일 「$job」의 자료를 Read로 끝까지 읽지 않았습니다. 안 읽은 자료:
$unread"
}

require_approval() {
  has_content "$dir/goal.md" || decide deny "qef 일 「$job」의 goal.md가 비어 있습니다. 사용자가 승인한 고정 목표가 있어야 구현할 수 있습니다."
  has_content "$dir/structure.md" || decide deny "qef 일 「$job」의 structure.md가 비어 있습니다. 다음 구조를 사용자에게 승인받아 적습니다. 구조 결정이 없는 일은 '구조 결정 없음' 한 줄로 승인받습니다."
  for name in $(oversized goal.md structure.md progress.md); do
    [ "$name" != progress.md ] || continue
    [ -z "$(missing_ranges "$dir/$name" "$session")" ] || decide deny "$name이 주입 상한을 넘어 이 세션에 실리지 않았습니다. Read로 끝까지 읽습니다: $dir/$name"
  done
}

called_skill() { "$(dirname "$0")/skill-called.sh" "$(field transcript_path)" "qef:$1"; }

tool=$(field tool_name)
case "$tool" in
  Write | Edit | NotebookEdit)
    path=$(field file_path)
    [ -n "$path" ] || path=$(field notebook_path)
    path=$(real_path "$path")
    case "$path" in
      "$dir/goal.md" | "$dir/structure.md" | "$dir/sources.txt")
        [ -z "$agent" ] || decide deny "$(basename "$path")는 조율 세션이 사용자 승인을 받아 씁니다."
        ;;
      "$root"/*) ;;
      *) exit 0 ;;
    esac
    [ -z "$agent" ] || exit 0
    case "$path" in
      "$dir/sources.txt")
        decide ask "끝까지 읽을 자료 목록을 직접 고칩니다. 추가는 job.sh add로 하므로, 이 변경은 목록에서 빼는 일일 수 있습니다."
        ;;
      "$dir/goal.md")
        require_sources
        decide ask "고정 목표를 씁니다. 배경, 작업 유형, 요구사항의 출처를 보고 승인합니다."
        ;;
      "$dir/structure.md")
        require_sources
        has_content "$dir/goal.md" || decide deny "고정 목표를 먼저 승인받아야 구조 목표를 쓸 수 있습니다."
        called_skill model && called_skill layout || decide deny "마지막 compaction 뒤에 qef:model과 qef:layout을 호출한 뒤에 구조 목표를 씁니다."
        decide ask "구조 목표를 씁니다. 타입 트리를 보고 승인합니다. 코드에 고정돼 지우는 변경이면 그것을 확인합니다."
        ;;
      "$qef"/*) exit 0 ;;
    esac
    require_sources
    require_approval
    ;;
  Agent)
    [ -z "$agent" ] || exit 0
    require_sources
    case "$(field subagent_type)" in
      qef:architect | qef:architect-reviewer | qef:ux-designer | qef:ux-reviewer | qef:ui-designer | qef:ui-reviewer | qef:reviewer) ;;
      *) require_approval ;;
    esac
    ;;
  Bash)
    [ -z "$agent" ] || exit 0
    command=$(command_field)
    printf '%s' "$command" | grep -Eq '(^|[ |;&(])(cut|head|tail|sed|grep|egrep|fgrep|rg|awk)( |$)' || exit 0
    sources | while IFS= read -r source; do
      printf '%s' "$command" | grep -qF "$(basename "$source")" || continue
      ranges=$(missing_ranges "$source")
      [ -z "$ranges" ] || decide deny "자료 $source를 끝까지 읽기 전에는 잘라 읽을 수 없습니다. Read로 읽습니다. 남은 곳: $ranges"
    done
    ;;
esac
exit 0
