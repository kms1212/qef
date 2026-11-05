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

[ "$failures" -eq 0 ] && { echo 'all passed'; exit 0; }
printf '%s failed\n' "$failures"
exit 1
