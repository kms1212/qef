#!/bin/sh
cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"세션이 실제로 시작됐다면(제안 카드만 띄운 경우가 아니면) 지금 정한다: 그 결과를 이 세션이 다음 판단이나 작업의 입력으로 쓰는가? 쓰지 않고 사용자가 따로 보고 지휘할 일이면 mcp__ccd_session_mgmt__detach_session으로 곧바로 뗀다. 사용자에게 묻지 않는다. 기준은 qef:execute의 일을 나누는 방식 표다."}}
EOF
