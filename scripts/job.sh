#!/bin/sh
# A job's lifetime: open and add are run by the agent; the rest is driven by hook events on stdin.
scripts=$(cd "$(dirname "$0")" && pwd)

if [ "$1" = open ] || [ "$1" = add ]; then
  command=$1
  session_arg=$2
  shift 2
  job_input=$(printf '{"session_id":"%s","cwd":"%s"}' "$session_arg" "$PWD")
  . "$scripts/job-lib.sh"
  mkdir -p "$sessions"
  case "$command" in
    open)
      name=$1
      case "$name" in
        '' | .* | */* | *'"'* | *' '* | archive) echo "일 이름으로 쓸 수 없습니다: $name" >&2; exit 1 ;;
      esac
      dir="$qef/$name"
      [ -f "$dir/goal.md" ] && { echo "이미 있는 일입니다: $name" >&2; exit 1; }
      mkdir -p "$dir"
      printf '# 고정 목표\n\n## 일의 이유\n\n## 일의 성격\n\n## 사용자 원문\n\n## 금지와 전제\n\n## 요구사항\n\n## 업무 사실\n\n## 범위 밖\n\n## 후보\n\n## 정해지지 않은 것\n' > "$dir/goal.md"
      printf '# 구조 목표\n' > "$dir/structure.md"
      printf '# 진행 상황\n' > "$dir/progress.md"
      printf '# 사고 기록\n' > "$dir/reasoning.md"
      printf '# 끝까지 읽을 자료. 한 줄에 경로 하나, 저장소 루트 기준.\n' > "$dir/sources.txt"
      exclude=$(git -C "$root" rev-parse --git-path info/exclude 2>/dev/null)
      if [ -n "$exclude" ]; then
        case "$exclude" in /*) ;; *) exclude="$root/$exclude" ;; esac
        grep -qx '.qef/' "$exclude" 2>/dev/null || echo '.qef/' >> "$exclude"
      fi
      printf '%s\n' "$name" > "$sessions/$session"
      echo "일을 열고 이 세션을 묶었습니다: $dir"
      ;;
    add)
      bound_job || { echo '이 세션은 어느 일에도 묶이지 않았습니다.' >&2; exit 1; }
      for source in "$@"; do
        path=$(real_path "$source")
        [ -f "$path" ] || { echo "파일이 없습니다: $source" >&2; exit 1; }
        if [ "$(wc -c < "$path")" -gt 262144 ]; then
          echo "256KB를 넘어 목록에 넣지 않았습니다: $source. 일 전체에 걸치는 줄을 출처와 함께 뽑아 goal.md로 승인받으세요." >&2
          exit 1
        fi
        grep -qxF "$source" "$dir/sources.txt" || printf '%s\n' "$source" >> "$dir/sources.txt"
      done
      ;;
  esac
  exit 0
fi

. "$scripts/job-lib.sh"

emit() {
  text=$(cat)
  [ -n "$text" ] || exit 0
  printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}' "$event" "$(printf '%s' "$text" | json_escape)"
}

open_jobs() {
  for candidate in "$qef"/*/goal.md; do
    [ -f "$candidate" ] && basename "$(dirname "$candidate")"
  done
}

stale_note() {
  snapshot=$(sed -n 's/^스냅샷: *\([0-9a-f]\{7,\}\).*/\1/p' "$dir/progress.md" | tail -n 1)
  [ -n "$snapshot" ] || return 0
  index=$(mktemp)
  cp "$(git -C "$root" rev-parse --git-path index)" "$index" 2>/dev/null
  current=$(cd "$root" && GIT_INDEX_FILE=$index git add -A 2>/dev/null && GIT_INDEX_FILE=$index git write-tree 2>/dev/null)
  rm -f "$index"
  [ -n "$current" ] || return 0
  if ! git -C "$root" diff --quiet "$snapshot" "$current" 2>/dev/null; then
    printf '진행 상황의 스냅샷 %s 뒤로 코드가 바뀌었습니다.\n\n' "$snapshot"
  fi
}

context() {
  printf '이 세션은 qef 일 「%s」에 묶여 있습니다. 파일 자리: %s\n\n' "$job" "$dir"
  cat "$dir/goal.md"
  printf '\n'
  cat "$dir/structure.md"
  if [ "$1" = full ]; then
    printf '\n'
    cat "$dir/progress.md"
    printf '\n'
    stale_note
    unread=$(unread_sources)
    [ -z "$unread" ] || printf '아직 끝까지 읽지 않은 자료입니다. Read로 읽기 전에는 구현과 구조 결정이 막힙니다.\n%s\n\n' "$unread"
    size=$(wc -c < "$dir/reasoning.md")
    [ "$size" -le 65536 ] || printf '사고 기록이 %s바이트로 64KB를 넘었습니다. 일 전체에 걸치는 결론은 사용자 승인을 받아 goal.md로 올립니다.\n' "$size"
  fi
}

# The cap is on the injected text; past it Claude Code hands over only a path and a preview.
checked_context() {
  text=$(context "$1")
  printf '%s\n' "$text"
  count=$(printf '%s' "$text" | LC_ALL=en_US.UTF-8 wc -m | tr -d ' ')
  [ "$count" -le 9000 ] || printf '\n주입한 파일이 %s자라 상한 10,000자에 가깝습니다. progress.md와 goal.md를 줄입니다.\n' "$count"
}

enter() {
  name=${1%% *}
  mkdir -p "$sessions"
  if [ -n "$name" ] && [ -f "$qef/$name/goal.md" ]; then
    printf '%s\n' "$name" > "$sessions/$session"
    bound_job && checked_context full
    return
  fi
  jobs=$(open_jobs | paste -sd, - | sed 's/,/, /g')
  [ -n "$jobs" ] || return 0
  printf '이 세션은 어느 qef 일에도 묶이지 않았습니다. 열린 일: %s. 일을 이으려면 /qef:workflow <일 이름>으로 부릅니다.\n' "$jobs"
}

close() {
  name=${1%% *}
  if [ -z "$name" ]; then
    bound_job && name=$job
  fi
  target="$qef/$name"
  if [ -z "$name" ] || [ ! -f "$target/goal.md" ]; then
    printf '닫을 일을 찾지 못했습니다: %s. 열린 일: %s\n' "$name" "$(open_jobs | paste -sd, - | sed 's/,/, /g')"
    return
  fi
  if grep -Ev '^[[:space:]]*(#.*)?$' "$target/structure.md" | grep -qv '^구조 결정 없음'; then
    printf '일 「%s」을 닫지 않았습니다. 구조 목표가 남아 있습니다.\n' "$name"
    cat "$target/structure.md"
    return
  fi
  archived="$qef/archive/$(date +%Y-%m-%d)-$name"
  mkdir -p "$qef/archive"
  [ ! -e "$archived" ] || archived="$archived-$$"
  mv "$target" "$archived"
  [ -d "$sessions" ] && grep -lxF "$name" "$sessions"/* 2>/dev/null | while IFS= read -r mark; do rm -f "$mark" "$mark.reads"; done
  printf '일 「%s」을 닫아 %s로 옮겼습니다. 아래 고정 목표에서 프로젝트 규칙으로 올릴 줄이 있으면 사용자에게 안을 보입니다.\n\n' "$name" "$archived"
  cat "$archived/goal.md"
}

case "$event" in
  UserPromptExpansion)
    case "$(field command_name)" in
      qef:workflow | workflow) enter "$(field command_args)" | emit ;;
      qef:close | close) close "$(field command_args)" | emit ;;
    esac
    ;;
  PostToolUse)
    [ -z "$agent" ] || exit 0
    [ "$(field skill)" = qef:workflow ] || exit 0
    enter "$(field args)" | emit
    ;;
  SessionStart)
    mark="$sessions/.cleared"
    if [ "$(field source)" = clear ] && [ -n "$(find "$mark" -mmin -1 2>/dev/null)" ]; then
      cat "$mark" > "$sessions/$session"
      rm -f "$mark"
    fi
    bound_job || exit 0
    checked_context full | emit
    ;;
  SessionEnd)
    [ "$(field reason)" = clear ] || exit 0
    bound_job || exit 0
    printf '%s\n' "$job" > "$sessions/.cleared"
    ;;
  SubagentStart)
    bound_job || exit 0
    checked_context | emit
    ;;
esac
exit 0
