# Shared by every qef hook: reads the hook's JSON input once and gives field access and output escaping.
input=${hook_input:-$(cat)}

field() { printf '%s' "$input" | sed -n "s/.*\"$1\":\"\\([^\"]*\\)\".*/\\1/p"; }

# The Bash tool's command as it appears inside the JSON, escapes included.
command_field() { printf '%s' "$input" | sed -nE 's/.*"command":"(([^"\\]|\\.)*)".*/\1/p'; }

json_escape() {
  awk 'BEGIN { ORS = "" } { gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); gsub(/\r/, ""); if (NR > 1) print "\\n"; print }'
}
