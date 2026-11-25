#!/bin/sh
# 사용자가 직접 시키는 git·docker 동작이면 묻게 한다. 읽기 전용 꼴(목록, dry-run, 보기)은 묻지 않는다.
# 명령을 구분자·괄호·따옴표마다 잘라 조각마다 본다. 따옴표 안의 글도 조각이 되므로, 메시지에 명령 이름이 있으면 더 묻는 쪽으로 틀린다.
. "$(dirname "$0")/hook-lib.sh"

norm=$(command_field \
  | sed -e 's/\\\\/ /g' -e 's/\\"/"/g' -e 's/\\n/;/g' -e 's/\\t/ /g' \
  | sed -E 's/(^|[;&|[:space:]])git([[:space:]]+-[Cc][[:space:]]+[^[:space:]]+)+/\1git/g')

has() { printf '%s\n' "$s" | grep -Eq -- "$1"; }

asks() {
  s=" $1 "
  g='[[:space:]]git[[:space:]]+'
  has "${g}push[[:space:]]" && ! has "[[:space:]](-n|--dry-run)[[:space:]]" && return 0
  has "${g}rebase[[:space:]]" && ! has "[[:space:]]--show-current-patch[[:space:]]" && return 0
  has "${g}clean[[:space:]]" && ! has "[[:space:]](--dry-run|-[a-zA-Z]*n[a-zA-Z]*)[[:space:]]" && return 0
  has "${g}(merge|worktree[[:space:]]+add|checkout[[:space:]]+-b|switch[[:space:]]+-c)[[:space:]]" && return 0
  has "${g}tag[[:space:]]+(-a|-s|-u|-d|-f|-m|-F|-e|--annotate|--sign|--local-user|--delete|--force|--message|--file|--edit|[^-[:space:]])" && return 0
  has "${g}branch[[:space:]]+[^-[:space:]]|${g}branch([[:space:]]+[^[:space:]]+)*[[:space:]]+(-[a-zA-Z]*[dDmMcCftu][a-zA-Z]*|--(delete|move|copy|force|track|set-upstream-to(=[^[:space:]]*)?|unset-upstream|edit-description))[[:space:]]" && return 0
  has "${g}(reset[[:space:]]+--hard|checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+(-[^[:space:]]+[[:space:]]+)*\.)[[:space:]]" && return 0
  has "${g}stash[[:space:]]+(push|pop|apply|drop|clear|save|create|store|branch|-[^[:space:]]*)[[:space:]]|${g}stash[[:space:]]*$" && return 0
  has "[[:space:]]docker[[:space:]]+compose([[:space:]]+[^[:space:]]+)*[[:space:]]+up[[:space:]]" && ! has "[[:space:]]--dry-run[[:space:]]" && return 0
  return 1
}

printf '%s\n' "$norm" | tr ';&|()`"'"'" '\n' | sed -E 's/\$$//' | while IFS= read -r seg; do
  if asks "$seg"; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"사용자가 직접 시키는 git·docker 동작"}}'
    exit 0
  fi
done
exit 0
