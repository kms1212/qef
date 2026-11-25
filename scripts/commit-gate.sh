#!/bin/sh
# Blocks git commit when the project's deterministic check fails. Judgment calls do not belong here.
. "$(dirname "$0")/hook-lib.sh"

# Quoted text goes first so a message or an echo cannot look like a command; then one simple command per line.
commit_line=$(command_field \
  | sed -e 's/\\\\/ /g' -e 's/\\"/"/g' -e 's/\\n/;/g' -e 's/\\t/ /g' -e 's/"[^"]*"//g' -e "s/'[^']*'//g" \
  | tr ';&|' '\n' \
  | grep -E '^[[:space:]$({]*([A-Za-z_][A-Za-z0-9_]*=[^ ]* +)*git( +-[^ ]+( +[^- ][^ ]*)?)* +commit([ )]|$)') || exit 0

cwd=$(field cwd)
root=$(git -C "${cwd:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
check="$root/.claude/qef/commit-check"

[ -x "$check" ] || exit 0

if printf '%s' "$commit_line" | grep -Eq ' (-[a-zA-Z]*a[a-zA-Z]*|--all)( |\)|$)'; then
  files=$(git -C "$root" diff --name-only HEAD)
else
  files=$(git -C "$root" diff --name-only --cached)
fi

output=$(cd "$root" && printf '%s\n' "$files" | "$check" 2>&1)
status=$?
[ "$status" -eq 0 ] && exit 0

printf 'qef 커밋 게이트: .claude/qef/commit-check가 코드 %s로 실패해 커밋을 막았습니다.\n' "$status" >&2
printf '%s\n' "$output" | tail -n 40 >&2
exit 2
