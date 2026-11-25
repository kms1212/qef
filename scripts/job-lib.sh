# Shared by the job scripts. A session is under a job only if .qef/.sessions/<session id> names one.
. "$(dirname "$0")/hook-lib.sh"

event=$(field hook_event_name)
session=$(field session_id)
agent=$(field agent_id)
cwd=$(field cwd)
root=$(git -C "${cwd:-.}" rev-parse --show-toplevel 2>/dev/null) || root=$cwd
root=$(cd "${root:-.}" 2>/dev/null && pwd -P) || exit 0
qef="$root/.qef"
sessions="$qef/.sessions"

bound_job() {
  [ -f "$sessions/$session" ] || return 1
  job=$(cat "$sessions/$session")
  dir="$qef/$job"
  [ -f "$dir/goal.md" ] || { rm -f "$sessions/$session"; return 1; }
}

# Blank lines and headings do not count as content.
has_content() { [ -f "$1" ] && grep -qEv '^[[:space:]]*(#.*)?$' "$1"; }

real_path() {
  case "$1" in
    /*) target=$1 ;;
    *) target="$root/$1" ;;
  esac
  parent=$(cd "$(dirname "$target")" 2>/dev/null && pwd -P) || { printf '%s\n' "$target"; return; }
  printf '%s/%s\n' "$parent" "$(basename "$target")"
}

sources() { [ -f "$dir/sources.txt" ] && grep -Ev '^[[:space:]]*(#.*)?$' "$dir/sources.txt"; }

# Hook text past 10,000 characters reaches the model only as a path and a preview, so files that do not fit are left to Read.
oversized() {
  budget=8000
  for name in "$@"; do
    count=$(LC_ALL=en_US.UTF-8 wc -m < "$dir/$name" | tr -d ' ')
    if [ "$count" -le "$budget" ]; then
      budget=$((budget - count))
    else
      printf '%s ' "$name"
    fi
  done
}

# Prints the line ranges of a file not yet read in its current content; nothing when fully read.
# A source needs one read per job. With a session as the second argument, only that session's reads count.
missing_ranges() {
  path=$(real_path "$1")
  [ -f "$path" ] || { echo '파일 없음'; return; }
  sum=$(cksum < "$path" | tr -d ' \t')
  log="$dir/.reads"
  [ -f "$log" ] || { echo '전체'; return; }
  awk -F '\t' -v p="$path" -v s="$sum" -v only="$2" '$1 == p && $2 == s && (only == "" || $6 == only) { print $3 "\t" $4 "\t" $5 }' "$log" \
    | sort -n \
    | awk -F '\t' '
        { if ($3 > total) total = $3
          if ($1 > next_line) { out = out (out ? ", " : "") next_line "~" ($1 - 1) }
          if ($1 + $2 > next_line) next_line = $1 + $2 }
        BEGIN { next_line = 1 }
        END {
          if (NR == 0) { print "전체"; exit }
          if (next_line <= total) out = out (out ? ", " : "") next_line "~" total
          if (out) print out
        }'
}

unread_sources() {
  sources | while IFS= read -r source; do
    ranges=$(missing_ranges "$source")
    [ -z "$ranges" ] || printf '%s (%s)\n' "$source" "$ranges"
  done
}
