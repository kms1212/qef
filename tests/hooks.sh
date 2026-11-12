#!/bin/sh
# Runs the plugin's hook scripts against controlled inputs. Usage: tests/hooks.sh [plugin root]
root=$(cd "${1:-$(dirname "$0")/..}" && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
failures=0

fail() {
  failures=$((failures + 1))
  printf 'FAIL %s\n' "$1"
}

repo="$tmp/repo"
mkdir -p "$repo/.qef"
git -C "$repo" init -q
git -C "$repo" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
echo one > "$repo/tracked"
git -C "$repo" add tracked
git -C "$repo" -c user.name=t -c user.email=t@t commit -q -m tracked
echo two >> "$repo/tracked"
echo staged > "$repo/staged"
git -C "$repo" add staged

cat > "$repo/.qef/commit-check" <<EOF
#!/bin/sh
cat > "$tmp/seen"
exit \$(cat "$tmp/rc")
EOF
chmod +x "$repo/.qef/commit-check"

# The command argument is written as it appears inside the hook's JSON, escapes included.
gate() {
  : > "$tmp/seen"
  printf '{"session_id":"s","cwd":"%s","tool_name":"Bash","tool_input":{"command":"%s","description":"git commit"}}' "$repo" "$1" \
    | "$root/scripts/commit-gate.sh" >/dev/null 2>&1
}

echo 1 > "$tmp/rc"
while IFS= read -r command; do
  gate "$command"
  [ $? -eq 2 ] || fail "should block: $command"
done <<'EOF'
git commit -m x
git commit -m \"x\"
git add a && git commit -m \"x\"
echo \"done\" && git commit -m x
git add \"a b.txt\" && git commit -m x
cd sub; git commit -m x
true | git commit -F -
FOO=bar git commit -m x
git -C . commit -m x
git -C \"a b\" commit -m x
git -c a.b=c commit -m x
(git commit -m x)
git commit -m \"한글 메시지\"
git commit -m \"$(cat <<'EOF'\nsay \"hi\"\nEOF\n)\"
git add a\ngit commit -m x
EOF

while IFS= read -r command; do
  gate "$command"
  [ $? -eq 0 ] || fail "should pass: $command"
done <<'EOF'
git status
git log --grep commit
echo git commit
echo \"git commit\"
git show commit
grep -r \"; git commit\" docs
EOF

echo 0 > "$tmp/rc"
expect_files() {
  gate "$1"
  [ "$(tr '\n' ' ' < "$tmp/seen")" = "$2" ] || fail "files for: $1: got [$(tr '\n' ' ' < "$tmp/seen")], want [$2]"
}
expect_files 'git commit -m x' 'staged '
expect_files 'git commit --amend -m x' 'staged '
expect_files 'git commit -am x' 'staged tracked '
expect_files 'git commit -a -m x' 'staged tracked '
expect_files 'git commit -m \"x\" -a' 'staged tracked '
expect_files 'git commit --all -m x' 'staged tracked '
expect_files 'git add \"-a\" && git commit -m x' 'staged '

invoked="$tmp/invoked.jsonl"
other="$tmp/other.jsonl"
printf '{"name":"Skill","input":{"skill":"qef:workflow"}}\n' > "$invoked"
printf '{"name":"Skill","input":{"skill":"qef:dev"}}\n' > "$other"

restore() {
  printf '{"hook_event_name":"%s","source":"%s","reason":"%s","cwd":"%s","transcript_path":"%s"}' "$1" "$2" "$2" "$repo" "$3" \
    | CLAUDE_PLUGIN_ROOT="$root" CLAUDE_PLUGIN_DATA="$tmp/data" "$root/scripts/restore-workflow.sh"
}

[ -n "$(restore SessionStart compact "$invoked")" ] || fail 'compact in a qef session should restore'
[ -z "$(restore SessionStart compact "$other")" ] || fail 'compact outside qef should stay silent'

restore SessionEnd clear "$invoked"
[ -n "$(restore SessionStart clear "$tmp/new.jsonl")" ] || fail '/clear in a qef session should restore'
[ -z "$(restore SessionStart clear "$tmp/new.jsonl")" ] || fail 'the /clear mark should work once'

restore SessionEnd clear "$other"
[ -z "$(restore SessionStart clear "$tmp/new.jsonl")" ] || fail '/clear outside qef should stay silent'

work="$tmp/work"
mkdir -p "$work"
git -C "$work" init -q
git -C "$work" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
work=$(cd "$work" && pwd -P)
seq 1 5 > "$work/doc.md"
seq 1 300000 > "$work/huge.md"

job() { (cd "$work" && "$root/scripts/job.sh" "$@") 2>/dev/null; }
hook() {
  printf '%s' "$2" | "$root/scripts/$1" 2>/dev/null
}
common() { printf '"session_id":"%s","cwd":"%s","transcript_path":"%s"' "${1:-s1}" "$work" "$tmp/transcript.jsonl"; }
pre() { hook job-gate.sh "{$(common "$3"),\"hook_event_name\":\"PreToolUse\",\"tool_name\":\"$1\",\"tool_input\":$2}"; }
read_lines() {
  hook read-log.sh "{$(common "$5"),\"hook_event_name\":\"PostToolUse\",\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$1\"},\"tool_response\":{\"type\":\"text\",\"file\":{\"filePath\":\"$1\",\"content\":\"x\",\"numLines\":$3,\"startLine\":$2,\"totalLines\":$4}}}"
}
write_to() { pre Write "{\"file_path\":\"$1\",\"content\":\"x\"}" "$2"; }
expect() { case "$2" in *"$3"*) ;; *) fail "$1: got [$2]" ;; esac; }
expect_none() { [ -z "$2" ] || fail "$1: got [$2]"; }
: > "$tmp/transcript.jsonl"
d="$work/.qef/j"

expect_none 'an unbound session is not gated' "$(write_to "$work/a.ts")"
expect_none 'an unbound session is not gated (agent)' "$(pre Agent '{"subagent_type":"qef:implementer","prompt":"x"}')"
enter() { hook job.sh "{$(common "$2"),\"hook_event_name\":\"UserPromptExpansion\",\"command_name\":\"qef:workflow\",\"command_args\":\"$1\"}"; }
expect_none 'nothing is open, entering says nothing' "$(enter nope)"

job open s1 j >/dev/null || fail 'open should work'
[ -f "$d/goal.md" ] && [ -f "$d/structure.md" ] && [ -f "$d/progress.md" ] && [ -f "$d/reasoning.md" ] && [ -f "$d/sources.txt" ] || fail 'open should make the files'
job open s1 j && fail 'open should refuse an existing job'
job open s1 a/b && fail 'open should refuse a path'
job open s1 'a b' && fail 'open should refuse a space'
grep -qx '.qef/' "$work/.git/info/exclude" || fail 'open should exclude .qef'

expect 'an empty goal blocks code' "$(write_to "$work/a.ts")" 'goal.md가 비어'
expect 'an empty goal blocks the implementer' "$(pre Agent '{"subagent_type":"qef:implementer","prompt":"x"}')" 'goal.md가 비어'
expect_none 'an architect needs no approval' "$(pre Agent '{"subagent_type":"qef:architect","prompt":"x"}')"
expect_none 'its reviewer needs no approval' "$(pre Agent '{"subagent_type":"qef:architect-reviewer","prompt":"x"}')"
expect_none 'ux-designer needs no approval' "$(pre Agent '{"subagent_type":"qef:ux-designer","prompt":"x"}')"
expect_none 'ux-reviewer needs no approval' "$(pre Agent '{"subagent_type":"qef:ux-reviewer","prompt":"x"}')"
expect_none 'ui-designer needs no approval' "$(pre Agent '{"subagent_type":"qef:ui-designer","prompt":"x"}')"
expect_none 'ui-reviewer needs no approval' "$(pre Agent '{"subagent_type":"qef:ui-reviewer","prompt":"x"}')"
expect_none 'progress stays free' "$(write_to "$d/progress.md")"

job add s1 huge.md && fail 'add should refuse a file over 256KB'
job add s1 doc.md || fail 'add should work'
job add s1 doc.md
[ "$(grep -c '^doc.md$' "$d/sources.txt")" = 1 ] || fail 'add should not repeat a path'

expect 'unread sources block the goal' "$(write_to "$d/goal.md")" 'doc.md (전체)'
expect 'unread sources block any agent' "$(pre Agent '{"subagent_type":"qef:architect","prompt":"x"}')" 'doc.md (전체)'
expect 'cutting an unread source is blocked' "$(pre Bash '{"command":"head -n 2 doc.md"}')" '잘라 읽을 수 없습니다'
expect 'filtering an unread source is blocked' "$(pre Bash '{"command":"cat doc.md | cut -c1-40"}')" '잘라 읽을 수 없습니다'
expect_none 'other files can be cut' "$(pre Bash '{"command":"head -n 2 other.md"}')"
expect_none 'reading without cutting passes' "$(pre Bash '{"command":"git status"}')"
expect_none 'a subagent may cut' "$(hook job-gate.sh "{$(common),\"agent_id\":\"a\",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"head doc.md\"}}")"

read_lines "$work/doc.md" 1 2 6
expect 'a partial read is not enough' "$(write_to "$d/goal.md")" 'doc.md (3~6)'
read_lines "$work/doc.md" 3 4 6
expect 'pages add up, so the goal only asks now' "$(write_to "$d/goal.md")" '"ask"'
expect_none 'a fully read source can be searched' "$(pre Bash '{"command":"grep 3 doc.md"}')"
echo 6 >> "$work/doc.md"
expect 'a changed source is unread again' "$(write_to "$d/goal.md")" 'doc.md (전체)'
read_lines "$work/doc.md" 1 7 7

expect 'a subagent cannot write the goal' "$(hook job-gate.sh "{$(common),\"agent_id\":\"a\",\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$d/goal.md\"}}")" 'deny'
expect 'the source list asks' "$(write_to "$d/sources.txt")" '"ask"'

printf '# 고정 목표\n\n## 일의 이유\n구조가 무너졌다\n' > "$d/goal.md"
expect 'structure needs both design skills' "$(write_to "$d/structure.md")" 'qef:model'
printf '{"input":{"skill":"qef:model"}}\n' > "$tmp/transcript.jsonl"
expect 'structure needs layout too' "$(write_to "$d/structure.md")" 'qef:model'
printf '{"input":{"skill":"qef:model"}}\n{"input":{"skill":"qef:layout"}}\n' > "$tmp/transcript.jsonl"
expect 'structure asks after both skills' "$(write_to "$d/structure.md")" '"ask"'
expect 'empty structure still blocks code' "$(write_to "$work/a.ts")" 'structure.md가 비어'
printf '# 구조 목표\nAccount: 구체 클래스\n' > "$d/structure.md"
expect_none 'approved files open the code' "$(write_to "$work/a.ts")"
expect_none 'approved files open the implementer' "$(pre Agent '{"subagent_type":"qef:implementer","prompt":"x"}')"
expect_none 'files outside the project are free' "$(write_to "$tmp/elsewhere.txt")"

seq 1 2 > "$work/doc2.md"
job add s1 doc2.md
context=$(enter j s3)
expect 'entering injects the goal' "$context" '구조가 무너졌다'
expect 'entering injects the structure' "$context" 'Account: 구체 클래스'
expect 'entering lists unread sources' "$context" 'doc2.md (전체)'
case "$context" in *'doc.md (전체)'*) fail 'a source read by another session is not unread' ;; esac
[ "$(cat "$work/.qef/.sessions/s3")" = j ] || fail 'entering should bind the session'
expect 'a new unread source blocks every session' "$(write_to "$work/a.ts" s3)" 'doc2.md (전체)'
read_lines "$work/doc2.md" 1 2 2 s1
expect_none 'a later session does not reread the sources' "$(write_to "$work/a.ts" s3)"
echo 3 >> "$work/doc2.md"
expect 'a changed source is unread for the whole job' "$(write_to "$work/a.ts" s3)" 'doc2.md (전체)'
read_lines "$work/doc2.md" 1 3 3 s3

cp "$d/goal.md" "$tmp/goal.keep"
seq 1 3000 >> "$d/goal.md"
oversize=$(enter j s8)
expect 'an oversized goal is left to Read' "$oversize" '싣지 않은 파일입니다. 지금 Read로 끝까지 읽습니다. goal.md'
expect 'the rest still fits' "$oversize" 'Account: 구체 클래스'
case "$oversize" in *'구조가 무너졌다'*) fail 'an oversized goal should not be injected' ;; esac
expect 'an unread oversized goal blocks code' "$(write_to "$work/a.ts" s8)" 'goal.md이 주입 상한'
read_lines "$d/goal.md" 1 3004 3004 s3
expect 'another session reading it does not count' "$(write_to "$work/a.ts" s8)" 'goal.md이 주입 상한'
read_lines "$d/goal.md" 1 3004 3004 s8
expect_none 'reading it opens the code' "$(write_to "$work/a.ts" s8)"
cp "$tmp/goal.keep" "$d/goal.md"
seq 1 4000 >> "$d/progress.md"
expect 'an oversized progress is left to Read' "$(enter j s8)" '지금 Read로 끝까지 읽습니다. progress.md'
expect_none 'an oversized progress does not block code' "$(write_to "$work/a.ts" s8)"
printf '# 진행 상황\n' > "$d/progress.md"
expect 'words after the job name are ignored' "$(enter 'j 이어서 진행' s7)" '구조가 무너졌다'
expect 'entering by a tool call works too' "$(hook job.sh "{$(common s4),\"hook_event_name\":\"PostToolUse\",\"tool_name\":\"Skill\",\"tool_input\":{\"skill\":\"qef:workflow\",\"args\":\"j\"},\"tool_response\":{\"success\":true}}")" '구조가 무너졌다'
expect 'a wrong name lists open jobs and does not create' "$(enter wrong s5)" '열린 일: j'
[ ! -e "$work/.qef/wrong" ] || fail 'a wrong name should not create a job'
[ ! -e "$work/.qef/.sessions/s5" ] || fail 'a wrong name should not bind'

session_start() { hook job.sh "{$(common "$2"),\"hook_event_name\":\"SessionStart\",\"source\":\"$1\"}"; }
expect 'compaction reinjects' "$(session_start compact s1)" '구조가 무너졌다'
expect_none 'an unbound session gets nothing' "$(session_start compact s9)"
expect 'a subagent gets goal and structure' "$(hook job.sh "{$(common),\"hook_event_name\":\"SubagentStart\",\"agent_id\":\"a\",\"agent_type\":\"x\"}")" 'Account: 구체 클래스'
hook job.sh "{$(common),\"hook_event_name\":\"SessionEnd\",\"reason\":\"clear\"}"
expect '/clear carries the job to the new session' "$(session_start clear s6)" '구조가 무너졌다'

tree=$(git -C "$work" add -A && git -C "$work" write-tree)
printf '# 진행 상황\n스냅샷: %s\n' "$tree" > "$d/progress.md"
case "$(session_start compact s1)" in *'뒤로 코드가 바뀌었습니다'*) fail 'an equal tree is not stale' ;; esac
echo changed > "$work/changed"
expect 'a changed tree is stale' "$(session_start compact s1)" '뒤로 코드가 바뀌었습니다'

close_job() { hook job.sh "{$(common "$2"),\"hook_event_name\":\"UserPromptExpansion\",\"command_name\":\"qef:close\",\"command_args\":\"$1\"}"; }
expect 'an unfinished structure refuses closing' "$(close_job j)" '닫지 않았습니다'
[ -f "$d/goal.md" ] || fail 'a refused close should keep the job'
printf '# 구조 목표\n구조 결정 없음\n' > "$d/structure.md"
expect 'closing moves the job' "$(close_job j)" '닫아'
[ ! -e "$d" ] || fail 'closing should move the folder'
[ -f "$work/.qef/archive/$(date +%Y-%m-%d)-j/goal.md" ] || fail 'closing should keep the files in the archive'
[ ! -e "$work/.qef/archive/$(date +%Y-%m-%d)-j/.reads" ] || fail 'closing should drop the read log'
expect_none 'a closed job gates nothing' "$(write_to "$work/a.ts")"
expect_none 'a closed job injects nothing' "$(session_start compact s1)"

[ "$failures" -eq 0 ] && { echo 'all passed'; exit 0; }
printf '%s failed\n' "$failures"
exit 1
