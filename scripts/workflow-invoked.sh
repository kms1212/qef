#!/bin/sh
# Exit 0 when the transcript shows this session runs under qef:workflow.
# Forms: Skill tool call, user-typed /qef:workflow, and the note restore-workflow.sh injects (it is all a post-/clear transcript has).
[ -f "$1" ] || exit 1
grep -Eq '"skill":"qef:workflow"|<command-name>/?qef:workflow</command-name>|qef:workflow를 지정해 진행 중' "$1"
