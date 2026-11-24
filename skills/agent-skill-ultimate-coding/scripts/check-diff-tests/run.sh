#!/usr/bin/env bash
# Tests for check-diff.sh: every file in bad/ must raise the rule named by its file
# name (bad/<rule-id>.<ext>), and every file in good/ must raise nothing. Also checks
# the known-prefix secret patterns, git mode (only added lines count) and the
# "check-diff: ok" mark. Run: bash run.sh   (exit 0 = all pass)
set -u
here=$(cd "$(dirname "$0")" && pwd)
tool="$here/../check-diff.sh"
fail=0

pass() { echo "ok    $1"; }
bad()  { echo "FAIL  $1"; fail=1; }

for f in "$here"/bad/*; do
  rule=$(basename "$f"); rule=${rule%%.*}
  out=$(bash "$tool" --files "$f" 2>&1)
  if printf '%s' "$out" | grep -q "\[$rule\]"; then pass "bad/$(basename "$f") -> [$rule]"
  else bad "bad/$(basename "$f") expected [$rule], got: $out"; fi
done

for f in "$here"/good/*; do
  if out=$(bash "$tool" --files "$f" 2>&1); then pass "good/$(basename "$f") is quiet"
  else bad "good/$(basename "$f") should be quiet, got: $out"; fi
done

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# Known secret prefixes, assembled at run time so no secret-shaped text is stored here.
printf 'key = "%s%s"\n' "AKIA" "ABCDEFGHIJKLMNOP" > "$tmp/aws.py"
printf 'TOKEN=%s%s\n' "ghp_" "abcdefghijklmnopqrstuvwxyz0123" > "$tmp/gh.sh"
for f in "$tmp/aws.py" "$tmp/gh.sh"; do
  if bash "$tool" --files "$f" 2>&1 | grep -q '\[secret\]'; then pass "prefix secret in $(basename "$f")"
  else bad "prefix secret in $(basename "$f") not found"; fi
done

# A file without a final newline must not shift the next file's findings.
printf 'x = 1' > "$tmp/a_no_newline.py"
printf 'y = 2\nresp = requests.get(u, verify=False)\n' > "$tmp/b_next.py"
if bash "$tool" --files "$tmp/a_no_newline.py" "$tmp/b_next.py" 2>&1 | grep -q 'b_next.py:2  \[tls-off\]'; then
  pass "file without final newline keeps the next file's line numbers"
else bad "file without final newline shifted the next file's findings"; fi

# The ok mark silences a line.
printf 'resp = requests.get(url, verify=False)  # check-diff: ok local test server only\n' > "$tmp/ack.py"
if bash "$tool" --files "$tmp/ack.py" >/dev/null 2>&1; then pass "check-diff: ok mark silences the line"
else bad "check-diff: ok mark did not silence the line"; fi

# Git mode: an old danger in a committed file is ignored; a new added line is caught.
(
  cd "$tmp" && git init -q repo && cd repo &&
  git -c user.email=t@t -c user.name=t commit -q --allow-empty -m init &&
  printf 'old = requests.get(u, verify=False)\n' > app.py && git add app.py &&
  git -c user.email=t@t -c user.name=t commit -q -m old &&
  printf 'x = 1\n' >> app.py &&
  bash "$tool" >/dev/null 2>&1
) && pass "git mode ignores old lines" || bad "git mode flagged an old, unchanged line"
(
  cd "$tmp/repo" && printf 'cur.execute("DELETE FROM t WHERE id = " + i)\n' >> app.py &&
  bash "$tool" 2>&1 | grep -q 'app.py:3  \[sql-string\]'
) && pass "git mode catches a new line with the right line number" || bad "git mode missed a new line"
(
  cd "$tmp/repo" && printf 'eval(user_input)\n' > new_file.py &&
  bash "$tool" 2>&1 | grep -q 'new_file.py:1  \[dynamic-code\]'
) && pass "git mode checks new untracked files" || bad "git mode missed an untracked file"

# Hook mode: reads the edited file from the hook JSON, exits 0, and returns findings as
# valid JSON additionalContext for Claude Code (nothing at all for a clean file).
out=$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s"}}' "$tmp/repo/new_file.py" | bash "$tool" --hook 2>/dev/null); rc=$?
if [ $rc -eq 0 ] && printf '%s' "$out" | python3 -c 'import json,sys; c=json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"]; assert "[dynamic-code]" in c' 2>/dev/null
then pass "hook mode returns findings as valid JSON, exit 0"; else bad "hook JSON (exit $rc): $out"; fi
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$here/good/safe.py" | bash "$tool" --hook 2>&1); rc=$?
[ $rc -eq 0 ] && [ -z "$out" ] && pass "hook mode is silent on a clean file" || bad "hook mode on a clean file (exit $rc): $out"

# Regression tests for bugs found in review. Each builds a small repo and checks one case.
G="git -c user.email=t@t -c user.name=t"
new_repo() { rm -rf "$tmp/r" && mkdir -p "$tmp/r" && cd "$tmp/r" && git init -q && $G commit -q --allow-empty -m init; }
expect() { # description, command output, pattern that must appear
  if printf '%s' "$2" | grep -q -- "$3"; then pass "$1"; else bad "$1 (got: $2)"; fi
}
expect_not() { # description, command output, pattern that must NOT appear
  if printf '%s' "$2" | grep -q -- "$3"; then bad "$1 (got: $2)"; else pass "$1"; fi
}

# Run under a UTF-8 locale (where awk would crash on a bad byte) to prove the script's own LC_ALL=C works.
utf8=$(locale -a 2>/dev/null | grep -i -m1 'utf-*8$'); [ -n "$utf8" ] || utf8=C.UTF-8
new_repo; printf 'eval(x)\n' > a.py; printf 'name = "caf\351"\n' > latin1.py
expect "a non-UTF-8 file does not hide other findings" "$(LC_ALL=$utf8 bash "$tool" 2>&1)" 'a.py:1  \[dynamic-code\]'

new_repo; bash "$tool" no-such-branch >/dev/null 2>&1; rc=$?
[ $rc -eq 3 ] && pass "unknown base exits 3" || bad "unknown base exited $rc"

new_repo; printf 'eval(x)\n' > 'k=v.py'
expect "file name with = is read (git mode)" "$(bash "$tool" 2>&1 </dev/null)" 'k=v.py:1  \[dynamic-code\]'
expect "file name with = is read (--files)" "$(printf 'x=1\n' | bash "$tool" --files 'k=v.py' 2>&1)" 'k=v.py:1  \[dynamic-code\]'

new_repo; printf 'a = 1\nr = get(u, verify=False)\n' > app.py && git add app.py && $G commit -q -m base
trunk=$(git rev-parse --abbrev-ref HEAD)
git checkout -q -b feature; printf 'x = 1\n' > other.py && git add other.py && $G commit -q -m feat
git checkout -q "$trunk"; printf 'a = 1\nr = get(u)\n' > app.py && $G commit -qam fix; git checkout -q feature
out=$(bash "$tool" "$trunk" 2>&1); rc=$?
if [ $rc -eq 0 ] && ! printf '%s' "$out" | grep -q tls-off; then pass "base branch: lines the base removed are not 'added'"
else bad "base branch diff (exit $rc): $out"; fi

new_repo; printf 'x = 1\n' > 'my file.py' && git add . && $G commit -q -m a && printf '# total = compute(order)\n' >> 'my file.py'
expect "path with a space: right name, comment rules work" "$(bash "$tool" 2>&1)" 'my file.py:2  \[commented-code\]'

new_repo; printf 'eval(x)\n' > 'café.py'
expect "untracked non-ASCII file name is checked" "$(bash "$tool" 2>&1)" 'café.py:1  \[dynamic-code\]'

new_repo; printf 'l1\nl2\nl3\nl4\nl5\nl6\n' > f.py && git add . && $G commit -q -m a && git config diff.interHunkContext 5
printf 'l1\nX\nl3\nl4\nl5\neval(x)\n' > f.py
expect "interHunkContext setting keeps line numbers right" "$(bash "$tool" 2>&1)" 'f.py:6  \[dynamic-code\]'

new_repo; mkdir sub && printf 'x\n' > sub/k.py && git add . && $G commit -q -m a && printf 'eval(x)\n' > root_new.py
expect "run from a subdirectory still sees untracked files at the root" "$(cd sub && bash "$tool" 2>&1)" 'root_new.py:1  \[dynamic-code\]'

new_repo; printf 'a\n-- old note\nb\n' > m.hs && git add . && $G commit -q -m a && printf 'a\n++ counter\neval(x)\nb\n' > m.hs
expect "'-- x' removed and '++ x' added lines are not file headers" "$(bash "$tool" 2>&1)" 'm.hs:3  \[dynamic-code\]'

printf 'try:\r\n    go()\r\nexcept Exception:\r\n    pass\r\n' > "$tmp/crlf.py"
expect "Windows line endings: two-line swallowed error" "$(bash "$tool" --files "$tmp/crlf.py" 2>&1)" 'crlf.py:3  \[swallowed-error\]'

printf 'image = "task-scheduler-service-panel"\nname = "risk-assessment-worker-v2"\n' > "$tmp/kebab.py"
expect_not "kebab-case names are not sk- secrets" "$(bash "$tool" --files "$tmp/kebab.py" 2>&1)" 'secret'

printf 'class NotFound(exceptions.APIException):\n    pass\n\ndef on_exception(self, exc): ...\n' > "$tmp/exc.py"
expect_not "names containing 'except' are not swallowed errors" "$(bash "$tool" --files "$tmp/exc.py" 2>&1)" 'swallowed'

new_repo; mkdir -p app && printf 'PASSWORD = "correct-horse-battery"\n' > tests.py && printf 'PASSWORD = "correct-horse-battery"\n' > app/test_auth.py
expect_not "fake secrets in tests.py and test_*.py are allowed" "$(bash "$tool" 2>&1)" 'secret'

mkdir -p "$tmp/build/proj" && printf 'eval(x)\n' > "$tmp/build/proj/app.py"
expect "--files checks a file even under a folder named build" "$(bash "$tool" --files "$tmp/build/proj/app.py" 2>&1)" '\[dynamic-code\]'
expect "--files warns about a missing file" "$(bash "$tool" --files "$tmp/nope.py" 2>&1)" 'no such file'

new_repo; printf 'eval(x)\n' > app.py; ln -s /nonexistent '.#app.py'
expect "a dangling symlink does not hide the files after it" "$(bash "$tool" 2>&1)" 'app.py:1  \[dynamic-code\]'
printf 'x\n' > "$tmp/unreadable.py"; chmod 000 "$tmp/unreadable.py"; printf 'eval(x)\n' > "$tmp/after.py"
expect "--files: an unreadable file does not hide the next one" "$(bash "$tool" --files "$tmp/unreadable.py" "$tmp/after.py" 2>&1)" 'after.py:1  \[dynamic-code\]'
chmod 644 "$tmp/unreadable.py"

new_repo; mkdir -p 'app/[id]' app/d && printf 'export const x = 1;\n' > 'app/[id]/page.tsx' && printf 'eval(x)\n' > app/d/page.tsx
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$tmp/r/app/[id]/page.tsx" | CLAUDE_PROJECT_DIR="$tmp/r" bash "$tool" --hook 2>&1)
[ -z "$out" ] && pass "hook: a path with [brackets] is literal, not a glob" || bad "hook treated [id] as a glob: $out"

printf 'begin; charge(order); rescue; end\n' > "$tmp/r.rb"
expect "Ruby one-line rescue; end is a swallowed error" "$(bash "$tool" --files "$tmp/r.rb" 2>&1)" 'swallowed-error'

new_repo; printf 'x = 1\n' > 'say "hi".py' && git add . && $G commit -q -m a && printf 'eval(x)\n' >> 'say "hi".py'
expect "a quoted file name is shown without git escapes" "$(bash "$tool" 2>&1)" 'say "hi".py:2'

mkdir -p "$tmp/tests/proj" && printf 'PASSWORD = "hunter2hunter2"\n' > "$tmp/tests/proj/app.py"
expect "--files: a project under a folder named tests keeps its secret check" "$(bash "$tool" --files "$tmp/tests/proj/app.py" 2>&1)" '\[secret\]'

new_repo; mkdir -p pkg && printf 'eval(x)\n' > pkg/new.py
expect "hook names the file from the repository root" "$(printf '{"tool_input":{"file_path":"%s"}}' "$tmp/r/pkg/new.py" | CLAUDE_PROJECT_DIR="$tmp/r" bash "$tool" --hook 2>&1)" 'pkg/new.py:1'
cd "$here"

# Security: a repository whose config names a program (core.fsmonitor) must never make
# check-diff run it, in git mode or in hook mode.
new_repo; printf 'x = 1\n' > a.py && git add . && $G commit -q -m a
git config core.fsmonitor "touch '$tmp/PWNED'"
printf 'eval(x)\n' >> a.py
bash "$tool" >/dev/null 2>&1
[ ! -e "$tmp/PWNED" ] && pass "git mode never runs core.fsmonitor" || bad "git mode ran core.fsmonitor"
rm -f "$tmp/PWNED"
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$tmp/r/a.py" | CLAUDE_PROJECT_DIR="$here" bash "$tool" --hook 2>&1)
[ ! -e "$tmp/PWNED" ] && pass "hook outside the project never runs that repo's git config" || bad "hook ran a foreign repo's git config"
expect "hook outside the project still checks the whole file" "$out" 'a.py:2  \[dynamic-code\]'
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$tmp/r/a.py" | CLAUDE_PROJECT_DIR="$tmp/r" bash "$tool" --hook 2>&1)
expect "hook inside the project uses git (added lines only)" "$out" 'a.py:2  \[dynamic-code\]'
expect_not "hook inside the project skips committed lines" "$out" 'a.py:1 '
git config --unset core.fsmonitor
cd "$here"

[ $fail -eq 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit $fail
