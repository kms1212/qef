#!/bin/sh
# Records which lines the coordinating session actually received from each Read, under its job.
. "$(dirname "$0")/job-lib.sh"

[ -z "$agent" ] || exit 0
bound_job || exit 0

path=$(field file_path)
[ -n "$path" ] || exit 0
path=$(real_path "$path")
[ -f "$path" ] || exit 0

number() { printf '%s' "$input" | sed -n "s/.*\"$1\":\\([0-9][0-9]*\\).*/\\1/p"; }
start=$(number startLine)
count=$(number numLines)
total=$(number totalLines)

# Files without line numbers, such as PDFs, come back whole or by the tool's own pages.
if [ -z "$total" ]; then
  start=1 count=1 total=1
fi

printf '%s\t%s\t%s\t%s\t%s\n' "$path" "$(cksum < "$path" | tr -d ' \t')" "$start" "$count" "$total" >> "$sessions/$session.reads"
exit 0
