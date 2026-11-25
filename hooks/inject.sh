#!/bin/sh
event=$(sed -n 's/.*"hook_event_name" *: *"\([A-Za-z]*\)".*/\1/p')
body=$(awk 'BEGIN { ORS = "" } { gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); gsub(/\r/, ""); if (NR > 1) print "\\n"; print }' "$(dirname "$0")/../qef.md")
printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}' "$event" "$body"
