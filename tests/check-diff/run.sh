#!/usr/bin/env bash
# Tests for check-diff.sh: every file in bad/ must raise the rule named by its file
# name (bad/<rule-id>.<ext>), every file in good/ must raise nothing, and every row of
# languages.tsv (one idiom per row, ~25 languages) must raise its rule or stay quiet. Also checks
# the known-prefix secret patterns, git mode (only added lines count) and the
# "check-diff: ok" mark. Run: bash tests/check-diff/run.sh   (exit 0 = all pass)
set -u
here=$(cd "$(dirname "$0")" && pwd)
tool="$here/../../skills/agent-skill-ultimate-coding/scripts/check-diff.sh"
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

# Language table (languages.tsv): each row is "expect<TAB>file<TAB>code", where <NL> in
# the code starts a new line and expect is a rule id or "none" (the file must stay quiet).
# It proves each rule in the idioms of every mainstream language, and no false alarms.
n=0
while IFS="$(printf '\t')" read -r expect file code; do
  case "$expect" in ''|'#'*) continue ;; esac
  n=$((n + 1)); mkdir -p "$tmp/lang/$n/$(dirname "$file")"
  printf '%s\n' "$code" | awk '{ gsub(/<NL>/, "\n"); print }' > "$tmp/lang/$n/$file"
  out=$(cd "$tmp/lang/$n" && bash "$tool" --files "$file" 2>&1)
  if [ "$expect" = none ]; then
    if printf '%s' "$out" | grep -q '\['; then bad "lang: $file stays quiet: $code -> $out"; else pass "lang: $file quiet: $code"; fi
  elif printf '%s' "$out" | grep -q "\[$expect\]"; then pass "lang: $file [$expect]: $code"
  else bad "lang: $file expected [$expect]: $code -> got: ${out:-nothing}"; fi
done < "$here/languages.tsv"

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

# Security: a file name with a quote and a backslash must give valid JSON with no extra keys.
new_repo; name='q"\x.py'; printf 'eval(x)\n' > "$name"
json_path=$(printf '%s' "$tmp/r/$name" | sed 's/\\/\\\\/g; s/"/\\"/g')
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$json_path" | CLAUDE_PROJECT_DIR="$tmp/r" bash "$tool" --hook 2>&1)
if printf '%s' "$out" | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert list(d) == ["hookSpecificOutput"] and list(d["hookSpecificOutput"]) == ["hookEventName", "additionalContext"]
assert "q\"\\x.py:1  [dynamic-code]" in d["hookSpecificOutput"]["additionalContext"]' 2>/dev/null
then pass "hook JSON stays valid for a name with a quote and a backslash"; else bad "hook JSON for a tricky name: $out"; fi
cd "$here"

# Removed safety checks ([removed-guard]): a committed file loses a check in the working
# tree. Each case: expected (removed-guard or none), description, path, before, after
# (printf format strings, so \n and \t work).
removed_case() {
  new_repo; mkdir -p "$(dirname "$3")"; printf "$4" > "$3"; git add . && $G commit -q -m a; printf "$5" > "$3"
  local out; out=$(bash "$tool" 2>&1)
  if [ "$1" = none ]; then expect_not "removed, quiet: $2" "$out" 'removed-guard'
  else expect "removed, flagged: $2" "$out" '\[removed-guard\]'; fi
}
removed_case removed-guard "Python auth decorator"   v.py   '@login_required\ndef view(r):\n    return ok(r)\n' 'def view(r):\n    return ok(r)\n'
removed_case removed-guard "Python raise"             f.py   'def f(u):\n    if not u.active:\n        raise PermissionDenied()\n    return u\n' 'def f(u):\n    return u\n'
removed_case removed-guard "Python rate limit"        r.py   '@limiter.limit("5/minute")\ndef login(r):\n    return go(r)\n' 'def login(r):\n    return go(r)\n'
removed_case removed-guard "Python form validation"   g.py   'def save(form):\n    form.full_clean()\n    form.save()\n' 'def save(form):\n    form.save()\n'
removed_case removed-guard "Go return err"            m.go   'x, err := load()\nif err != nil {\n\treturn err\n}\nuse(x)\n' 'x, _ := load()\nuse(x)\n'
removed_case removed-guard "JS throw"                 a.js   'if (!input.ok) {\n  throw new BadInput(input);\n}\ngo(input);\n' 'go(input);\n'
removed_case removed-guard "Ruby raise with modifier" s.rb   'def pay(o)\n  raise Unpaid unless o.paid?\n  ship(o)\nend\n' 'def pay(o)\n  ship(o)\nend\n'
removed_case none "removed try/catch lets errors out" t.js 'try {\n  go();\n} catch (e) {\n  report(e);\n}\n' 'go();\n'
removed_case none "raise in docstring prose"          d.py   'def f(x):\n    """It would never raise on bad input.\n    :raises ValueError: when x is bad\n    """\n    return x\n' 'def f(x):\n    """Returns x."""\n    return x\n'
removed_case none "template permission markup"        p.html '{%% if user.can("orders.view") %%}<a href="/o">Orders</a>{%% endif %%}\n<p>x</p>\n' '<p>x</p>\n'
removed_case none "guard words inside a log string"   lg.py  'log.info("[LIMITS] rate limiting on, login_required for /api")\nx = 1\n' 'x = 1\n'
removed_case none "guard words in docstring prose"    dp.py  'def f():\n    """Resets the counter, otherwise check_rate_limit\n    would see hits from the last run.\n    """\n' 'def f():\n    """Resets the counter."""\n'
removed_case none "a method named like a validator"   vm.js  'const o = {\n  sanitizedKey() {\n    return 1;\n  },\n};\n' 'const o = {};\n'
removed_case removed-guard "bare raise with no punctuation" br.py 'def f(u):\n    if u is None:\n        raise PermissionDenied\n    return u\n' 'def f(u):\n    return u\n'
removed_case none "five checks folded into one helper" h.py 'a = sanitize_text(d.get("a"))\nb = sanitize_text(d.get("b"))\nc = sanitize_text(d.get("c"))\n' 'def arg(k):\n    return sanitize_text(d.get(k))\na = arg("a")\nb = arg("b")\nc = arg("c")\n'
removed_case removed-guard "Java @PreAuthorize"       C.java '@PreAuthorize("hasRole(ADMIN)")\npublic void wipe() { db.wipe(); }\n' 'public void wipe() { db.wipe(); }\n'
removed_case removed-guard "C# [Authorize]"           C.cs   '[Authorize]\npublic class AdminController {}\n' 'public class AdminController {}\n'
removed_case removed-guard "Ruby before_action"       c.rb   'before_action :authenticate_user!\ndef show; end\n' 'def show; end\n'
removed_case removed-guard "record owner check"       o.ts   'if (doc.ownerId !== user.id) throw new Forbidden();\nreturn doc;\n' 'return doc;\n'
removed_case removed-guard "owner check with a quiet return" own.py 'def get(doc, user):\n    if doc.owner_id != user.id:\n        return None\n    return doc\n' 'def get(doc, user):\n    return doc\n'
removed_case none "reworded error message"            w.py   'raise ValueError("bad")\n' 'raise ValueError("amount must be positive")\n'
removed_case none "check moved within the file"       mv.py  'def f(u):\n    if not u:\n        raise NotFound()\n    a = 1\n    b = 2\n    return u\n' 'def f(u):\n    a = 1\n    b = 2\n    if not u:\n        raise NotFound()\n    return u\n'
removed_case none "removed comment line"              cm.py  '# raise if missing\nx = 1\n' 'x = 1\n'
removed_case none "test file loses an assert"         tests/test_x.py 'def test_a():\n    assert f() == 1\n    assert g() == 2\n' 'def test_a():\n    assert f() == 1\n'
removed_case none "look-alike names (scan, throwaway)" n.py 'results = scan(d)\nthrowaway = 1\n' 'x = 1\n'
removed_case none "acknowledged in the file"          k.py   'def f(r):\n    require_login(r)\n    return go(r)\n' 'def f(r):\n    # check-diff: ok removed-guard login now enforced by the router middleware\n    return go(r)\n'

new_repo; printf 'def f(u):\n    if not u:\n        raise NotFound()\n    return u\n' > a.py && git add . && $G commit -q -m a
printf 'def f(u):\n    check(u)\n    return u\n' > a.py; printf 'def check(u):\n    if not u:\n        raise NotFound()\n' > helpers.py
expect_not "removed, quiet: check moved into a new helper file" "$(bash "$tool" 2>&1)" 'removed-guard'

new_repo; printf '@login_required\ndef view(r):\n    return ok(r)\n' > dead.py && printf 'x = 1\n' > keep.py && git add . && $G commit -q -m a && rm dead.py
expect_not "removed, quiet: a whole deleted file" "$(bash "$tool" 2>&1)" 'removed-guard'

new_repo; printf 'def f(u):\n    if not u:\n        raise NotFound()\n    return u\n' > a.py && printf 'x = 1\n' > b.py && git add . && $G commit -q -m a
printf 'def f(u):\n    return u\n' > a.py; printf 'x = 1\nraise Unrelated()\n' > b.py
expect "removed, flagged: an unrelated new check in another file does not hide the loss" "$(bash "$tool" 2>&1)" 'a.py:[0-9]*  \[removed-guard\]'

new_repo; printf 'def f(u):\n    if not u:\n        raise NotFound()\n    return u\n' > a.py && git add . && $G commit -q -m a && printf 'def f(u):\n    return u\n' > a.py
out=$(printf '{"tool_input":{"file_path":"%s"}}' "$tmp/r/a.py" | CLAUDE_PROJECT_DIR="$tmp/r" bash "$tool" --hook 2>&1)
expect "removed, flagged: hook mode inside the project" "$out" '\[removed-guard\] raised error removed'
cd "$here"

[ $fail -eq 0 ] && echo "ALL PASS" || echo "SOME FAILED"
exit $fail
