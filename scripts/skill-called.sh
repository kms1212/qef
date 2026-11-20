#!/bin/sh
# Usage: skill-called.sh <transcript> <skill>...
# Exit 0 when every named skill was invoked after the transcript's last compaction.
# Compaction keeps only the start of each skill body, or drops it, so a call before it no longer counts.
transcript=$1
shift
[ -f "$transcript" ] || exit 1
start=$(grep -n '"subtype":"compact_boundary"' "$transcript" | tail -n 1 | cut -d: -f1)
for skill in "$@"; do
  tail -n "+${start:-1}" "$transcript" | grep -Eq "\"skill\":\"$skill\"|<command-name>/?$skill</command-name>" || exit 1
done
exit 0
