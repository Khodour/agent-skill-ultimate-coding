#!/usr/bin/env bash
# check-diff: flags known dangers in the lines a change ADDS (string-built SQL,
# TLS checks turned off, secrets in code, swallowed errors, I/O inside loops, ...).
#
# Why it exists: agents (weak models above all) agree with written rules and then
# write the usual code anyway. A tool's output is followed far more reliably than
# prose, so the Verify step runs this and the Claude Code plugin runs it after
# every file edit (hooks/hooks.json).
#
# It only reads added lines, so old code in the project creates no noise. Every
# finding is a signal, not a verdict: fix it, or mark a false alarm on that same
# line with a comment containing "check-diff: ok <reason>".
#
# Usage:
#   check-diff.sh                 added lines vs HEAD, plus new untracked files
#   check-diff.sh <base>          lines this branch adds since it left <base>, e.g. main
#   check-diff.sh --files a b     every line of the given files (no git needed)
#   check-diff.sh --hook          Claude Code hook: checks the edited file named in
#                                 the hook JSON on stdin (its uncommitted added lines)
# Exit: 0 = nothing found, 1 = findings, 3 = usage error. In --hook mode it always
#       exits 0 and hands findings to Claude as JSON "additionalContext".
#       Needs only bash, git and a POSIX awk.

set -u
# Byte-wise C locale: a file that is not valid UTF-8 must not crash awk and hide findings.
export LC_ALL=C
# Paths are always literal: a file named "app/[id]/page.tsx" must not match other files as a glob.
export GIT_LITERAL_PATHSPECS=1
# A repository's own config can name programs for git to run (core.fsmonitor,
# textconv, external diff). Turn those off for every git call made here.
GIT=(git -c core.fsmonitor=false -c core.quotePath=false)

MODE="git"
BASE="HEAD"
FILES=()

case "${1:-}" in
  --files) MODE="files"; shift; FILES=("$@") ;;
  --hook)  MODE="hook" ;;
  -h|--help) sed -n '2,21p' "$0"; exit 0 ;;
  "") ;;
  -*) echo "check-diff: unknown option $1 (see --help)" >&2; exit 3 ;;
  *)  BASE="$1" ;;
esac

# Reads NUL-separated paths on stdin and prints each file as a diff in which every
# line is added, so new files and --files mode go through the same parser as real
# diffs. One awk for all files keeps thousands of new files fast; awk (not sed)
# ends every line with a newline, so a file without a final newline cannot glue
# the next header onto its last line.
as_new_files() {
  xargs -0 awk '
    FNR == 1 { f = FILENAME; sub(/^\.\//, "", f)
               printf "diff --git a/%s b/%s\n--- /dev/null\n+++ b/%s\n@@ -0,0 +1 @@\n", f, f, f }
    { print "+" $0 }'
}

# Turns NUL-separated paths into "./path" so awk never reads a name such as
# "k=v.py" as a variable assignment. Skips anything awk cannot open (dangling
# symlinks such as editor lock files, unreadable files), because one such file
# would stop awk and hide every file after it.
dot_paths() {
  local f
  while IFS= read -r -d '' f; do
    [ -f "$f" ] && [ -r "$f" ] || continue
    case "$f" in /*) printf '%s\0' "$f" ;; *) printf './%s\0' "$f" ;; esac
  done
}

# Prints the given paths NUL-separated, warning about any that cannot be read.
existing_files() {
  local f
  for f in ${FILES[@]+"${FILES[@]}"}; do
    if [ -f "$f" ] && [ -r "$f" ]; then printf '%s\0' "$f"
    else echo "check-diff: no such file, or not readable: $f" >&2; fi
  done
}

if [ "$MODE" = "hook" ]; then
  # The hook JSON carries tool_input.file_path; a plain grep avoids needing jq.
  # Anything unexpected ends quietly with exit 0: a hook must never break a session.
  input=$(cat)
  path=$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//')
  [ -n "$path" ] && [ -f "$path" ] || exit 0
  cd "$(dirname "$path")" || exit 0
  FILES=("$(basename "$path")")
  # The hook fires on any file the agent edits, which can sit in a cloned repository
  # nobody has vetted. Use git only when the file belongs to the session's own project
  # repository (where git already runs); otherwise check the whole file without git.
  HOOK_GIT=0
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    proj_top=$(cd "$CLAUDE_PROJECT_DIR" 2>/dev/null && "${GIT[@]}" rev-parse --show-toplevel 2>/dev/null)
    file_top=$("${GIT[@]}" rev-parse --show-toplevel 2>/dev/null)
    [ -n "$proj_top" ] && [ "$proj_top" = "$file_top" ] && HOOK_GIT=1
  fi
fi

# Git setup at top level (not inside the pipeline, so a bad base really exits 3).
# Everything runs from the repository root, so diff paths and untracked paths agree.
INREPO=0
DIFFBASE=""
if [ "$MODE" = "git" ] || { [ "$MODE" = "hook" ] && [ "$HOOK_GIT" = 1 ]; }; then
  "${GIT[@]}" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "check-diff: not a git repository (use --files <paths>)" >&2; exit 3; }
  INREPO=1
  if [ "$MODE" = "hook" ]; then FILES=("$("${GIT[@]}" rev-parse --show-prefix)${FILES[0]}"); fi
  cd "$("${GIT[@]}" rev-parse --show-toplevel)" || exit 3
  if [ "$BASE" != "HEAD" ]; then
    "${GIT[@]}" rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || { echo "check-diff: unknown base '$BASE'" >&2; exit 3; }
    # Diff from where this branch left the base, so lines the base later removed
    # are not mistaken for lines this branch added.
    DIFFBASE=$("${GIT[@]}" merge-base "$BASE" HEAD) || { echo "check-diff: '$BASE' shares no history with HEAD" >&2; exit 3; }
  elif "${GIT[@]}" rev-parse --verify --quiet HEAD >/dev/null; then
    DIFFBASE="HEAD"
  fi
fi

# Prints the added lines of the change as a unified diff with no context.
collect() {
  if [ "$MODE" = "files" ] || [ "$INREPO" = 0 ]; then
    existing_files | dot_paths | as_new_files
  elif [ -z "$DIFFBASE" ]; then
    # A repository with no commits yet: every file counts as new.
    "${GIT[@]}" ls-files -z --cached --others --exclude-standard -- ${FILES[@]+"${FILES[@]}"} | dot_paths | as_new_files
  else
    "${GIT[@]}" diff -U0 --inter-hunk-context=0 --no-color --no-ext-diff --no-textconv \
      --src-prefix=a/ --dst-prefix=b/ "$DIFFBASE" -- ${FILES[@]+"${FILES[@]}"}
    "${GIT[@]}" ls-files -z --others --exclude-standard -- ${FILES[@]+"${FILES[@]}"} | dot_paths | as_new_files
  fi
}

# The rules. Each prints "path:line  [rule-id] problem -> fix". Patterns stick to
# POSIX awk (no \s, \b or {n}) so they run the same on macOS, Linux and BSD.
read -r -d '' RULES <<'AWK'
function flag(id, msg) {
  out[++n] = file ":" lnum "  [" id "] " msg
}
function code_ext(p,    e) {
  e = p; sub(/^.*\./, "", e); return e
}
BEGIN { n = 0 }
# File headers are read only inside a header block (from "diff --git" to the first
# "@@"), so a removed "-- x" or an added "++ x" line is never taken for a header.
/^diff --git / { inhdr = 1; next }
inhdr && /^\+\+\+ / {
  file = substr($0, 5)
  sub(/\t.*$/, "", file)                       # git adds a tab after names with spaces
  if (file ~ /^"/) {                            # names git still quotes: strip and unescape
    sub(/^"/, "", file); sub(/"$/, "", file); gsub(/\\"/, "\"", file); gsub(/\\\\/, "\\", file)
  }
  sub(/^b\//, "", file)
  skip = (file == "/dev/null")
  if (!filesmode)
    skip = skip || file ~ /(^|\/)(node_modules|bower_components|vendor|dist|build|coverage|site-packages|\.?venv|\.next|\.git)\// \
          || file ~ /\.(lock|min\.js|map|svg|png|jpe?g|gif|pdf|ico|woff2?|md|mdx|txt|rst|adoc|csv|tsv)$/ \
          || file ~ /(package-lock|yarn\.lock|pnpm-lock)/ \
          || file ~ /check-diff/
  ext = code_ext(file); loop = 0; prevnum = -9; prevtxt = ""
  # With --files and an absolute path, only the file name counts: a project that
  # lives under some folder named "tests" must not lose its checks.
  tpath = file; if (filesmode && tpath ~ /^\//) sub(/^.*\//, "", tpath)
  testfile = (tpath ~ /(^|\/)(tests?|spec|__tests__|fixtures?)\/|[._-](test|spec)\.[A-Za-z]+$|(^|\/)test_[^\/]*\.py$|(^|\/)tests\.py$/)
  next
}
/^@@ / {
  inhdr = 0
  split($0, h, " "); s = h[3]; sub(/^\+/, "", s); sub(/,.*/, "", s); lnum = s - 1
  loop = 0; prevnum = -9
  next
}
inhdr { next }                                  # index, mode, rename and binary lines
/^ / { lnum++; next }                           # context lines, if a git config adds them
/^\+/ {
  if (skip) next
  lnum++
  l = substr($0, 2)
  sub(/\r$/, "", l)                             # Windows line endings
  # Acknowledged false alarms, and minified or bundled lines nobody writes by hand.
  if (l ~ /check-diff: ok/ || length(l) > 400) { prevnum = lnum; prevtxt = l; next }
  lc = tolower(l)
  match(l, /^[ \t]*/); ind = RLENGTH
  hash_lang  = (ext ~ /^(py|rb|sh|bash|zsh|pl|r)$/)
  slash_lang = (ext ~ /^(js|jsx|ts|tsx|mjs|cjs|go|java|kt|kts|cs|c|cc|cpp|h|hpp|swift|rs|scala|php|dart)$/)
  comment = (hash_lang && l ~ /^[ \t]*#/) || (slash_lang && l ~ /^[ \t]*(\/\/|\/\*|\*)/)

  # Data never becomes code (MUST 1).
  if (!comment && lc ~ /(select[ \t].*[ \t]from[ \t]|insert[ \t]+into[ \t]|update[ \t].*[ \t]set[ \t]|delete[ \t]+from[ \t])/ &&
      lc ~ /["'`][ \t]*\+|\+[ \t]*["'`]|\$\{|#\{|\.format\(|["'][ \t]*%[ \t]*[(A-Za-z_]|(^|[^A-Za-z0-9_])f["']|sprintf\(|(=|<|>|[ \t]in|[ \t]like|values)[ \t]*\(?[ \t]*'?\$[A-Za-z_]|["'][ \t]*\.[ \t]*[$A-Za-z_]/)
    flag("sql-string", "SQL built from strings -> pass values as query parameters (MUST 1)")
  if (!comment && l ~ /(^|[^.>A-Za-z0-9_])(eval|exec|shell_exec|passthru)\(|new[ \t]+Function\(|shell[ \t]*=[ \t]*True|os\.system\(|Runtime\.getRuntime\(\)\.exec\(/)
    flag("dynamic-code", "code or a shell string built at runtime -> use an argument list or a safe API (MUST 1)")
  if (l ~ /innerHTML[ \t]*\+?=|outerHTML[ \t]*=|dangerouslySetInnerHTML|document\.write\(|mark_safe\(|\|[ \t]*safe[ \t]*\}|v-html=|\.html_safe/ || (file ~ /\.blade\.php$/ && l ~ /\{!!/))
    flag("raw-html", "raw HTML from data -> escape it or use text APIs (MUST 1)")

  # Never weaken a safety check (MUST 5) or open access (MUST 2).
  if (l ~ /verify[ \t]*=[ \t]*False|rejectUnauthorized["']?[ \t]*:[ \t]*false|InsecureSkipVerify[ \t]*:[ \t]*true|NODE_TLS_REJECT_UNAUTHORIZED|SSL_VERIFYPEER[^;]*(0|false|FALSE)|_create_unverified_context|CERT_NONE|TrustAll|trustAll/ ||
      l ~ /curl[^|;]*[ \t](-k|--insecure)([ \t]|$)/)
    flag("tls-off", "TLS verification turned off -> fix the certificate or CA bundle instead (MUST 5)")
  if (l ~ /chmod[ \t]+(-R[ \t]+)?0?777|0o777|0777/)
    flag("open-perms", "world-writable permissions -> grant the least access that works (MUST 5)")
  if (l ~ /csrf_exempt|csrf\.exempt|csrf\(\)\.disable|csrf[ \t]*:[ \t]*false|Access-Control-Allow-Origin["']?[ \t]*[,:][ \t]*["']\*|origin[ \t]*:[ \t]*["']\*["']|AllowAny|permitAll\(\)/)
    flag("safety-off", "CSRF, CORS or access check opened -> keep it on and allow only what is needed (MUST 2, 5)")

  # Secrets stay outside code (MUST 4).
  if ((lc ~ /(api[_-]?key|secret|passw(or)?d|token|private[_-]?key|access[_-]?key)["']?[ \t]*(:|=|:=|=>)[ \t]*["'][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t]/ &&
       !testfile && lc !~ /env|getenv|environ|example|changeme|xxxx|placeholder|dummy|your[_-]|<|\$\{|\{\{/) ||
      l ~ /AKIA[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]|xox[abposr]-[A-Za-z0-9]|(^|[^A-Za-z0-9_-])sk-[A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-]/)
    flag("secret", "secret written in code -> read it from the environment or a secret store; rotate it if it was ever committed (MUST 4)")

  # Never hand-roll auth or crypto (MUST 3).
  if (!comment && !testfile && lc ~ /passw|token|secret|otp|salt|nonce|reset|session/ &&
      (lc ~ /md5|sha1([^0-9]|$)/ || l ~ /Math\.random\(|random\.(random|randint|choice|choices)\(|(^|[^A-Za-z_])rand\(\)|mt_rand\(|new Random\(/))
    flag("weak-secret", "weak hash or predictable random for a secret -> use the platform's password hasher or secure random (MUST 3)")

  # Fix the cause, never swallow it (MUST 12). One-line forms here, two-line forms below.
  if (l ~ /^[ \t]*except([ \t(][^:]*)?:[ \t]*(pass|\.\.\.)[ \t]*(#.*)?$|catch[ \t]*(\([^)]*\))?[ \t]*\{[ \t]*\}|\.catch\([ \t]*(\([^)]*\)|[A-Za-z_]*)[ \t]*=>[ \t]*(\{[ \t]*\}|null|undefined)[ \t]*\)|(^|[^A-Za-z0-9_])rescue[^;]*;[ \t]*end|(^|[^A-Za-z_])_[ \t]*=[ \t]*err([^A-Za-z]|$)/)
    flag("swallowed-error", "error swallowed -> handle it, or log it and re-raise (MUST 12)")
  else if (lnum == prevnum + 1 && prevtxt ~ /^[ \t]*except([ \t(][^:]*)?:[ \t]*$|catch[ \t]*(\([^)]*\))?[ \t]*\{[ \t]*$|^[ \t]*rescue([ \t].*)?$/ && l ~ /^[ \t]*(pass|\.\.\.|\}|end)[ \t]*$/) {
    lnum--; flag("swallowed-error", "error swallowed -> handle it, or log it and re-raise (MUST 12)"); lnum++
  }

  # Never weaken a test (MUST 10).
  if (l ~ /(^|[^A-Za-z0-9_])(it|describe|test|context)\.(only|skip)\(|(^|[^A-Za-z0-9_.])(fit|fdescribe|xit|xdescribe|xtest)\(|@pytest\.mark\.(skip|xfail)([^a-z]|$)|@unittest\.skip|@Disabled|@Ignore|t\.Skip\(/)
    flag("skipped-test", "test skipped or focused -> run every test; fix the test or the code (MUST 10)")

  # Exact money (references/correctness.md).
  if (!comment && lc ~ /price|amount|total|cost|balance|money|fee|tax|salary|payment|refund/ &&
      l ~ /parseFloat\(|(^|[^A-Za-z_])float\(|Float\(|toFixed\(|(^|[^A-Za-z_])(double|Double|float|Float|f32|f64|float64)([^A-Za-z_0-9]|$)/)
    flag("float-money", "money in binary floating point -> integer cents or a decimal type (correctness.md)")

  # Clean code (structure.md): no leftovers.
  if (l ~ /(^|[^A-Za-z_])debugger[ \t]*;?[ \t]*$|breakpoint\(\)|pdb\.set_trace|binding\.pry|var_dump\(/)
    flag("debug-leftover", "debugger or dump left in -> remove it")
  if (l ~ /(TODO|FIXME|HACK)([^A-Za-z]|$)/)
    flag("todo", "TODO added -> fix it now, or list it in the report (no silent TODOs)")
  # Commented-out code: the comment's text has the shape of a statement, not prose.
  c = l; sub(/^[ \t]*(\/\/|#)[ \t]*/, "", c)
  if (comment && (c ~ /^(const|let|var)[ \t]+[A-Za-z_$][A-Za-z0-9_$]*[ \t]*=/ ||
                  c ~ /^[A-Za-z_$][A-Za-z0-9_$.]*\(.*\);[ \t]*$/ ||
                  c ~ /^(if|for|while)[ \t]*\(.*\)[ \t]*\{[ \t]*$/ ||
                  c ~ /^(def|function)[ \t]+[A-Za-z_$][A-Za-z0-9_$]*[ \t]*\(/ ||
                  c ~ /^import[ \t].*[ \t]from[ \t]+["']|^from[ \t]+[A-Za-z_.]+[ \t]+import[ \t]+[A-Za-z_*]/ ||
                  c ~ /^\$?[A-Za-z_][A-Za-z0-9_.]*(\[[^]]*\])?[ \t]*=[ \t]*[^= \t].*[;)][ \t]*$/ ||
                  c ~ /^return[ \t]+[^ \t].*;[ \t]*$/))
    flag("commented-code", "commented-out code -> delete it; version control remembers")

  # No I/O inside loops (performance.md rule 2). Looks at added lines deeper than
  # a loop header in the same hunk; a signal only, since context lines are not shown.
  if (l ~ /(map|forEach|for_each)\([ \t]*async/)
    flag("io-in-loop", "async call per item -> batch it into one query or call (performance.md)")
  else if (loop && lnum == prevnum + 1 && l !~ /^[ \t]*$/ && ind <= loopind)
    loop = 0
  else if (loop && !loopflagged && !testfile && ind > loopind &&
           l ~ /await[ \t]|\.query\(|\.execute\(|\.objects\.|\.find(One|By[A-Za-z]*|_by|All)\(|\.(save|first|get_or_create)\(|fetch\(|axios\.|requests\.(get|post|put|patch|delete)\(|http\.(Get|Post|Do)\(|DB::/) {
    flag("io-in-loop", "query or network call inside a loop (N+1) -> fetch everything in one query or call before the loop (performance.md)")
    loopflagged = 1
  }
  if (!comment && l ~ /^[ \t]*(for|while)([ \t(]|$)|\.forEach\(|\.each[ \t]+do|\.each[ \t]*\{|foreach[ \t]*\(|for[ \t]+[A-Za-z_, ]+[ \t]+in[ \t]/) {
    loop = 1; loopind = ind; loopflagged = 0
  }

  prevnum = lnum; prevtxt = l
  next
}
END {
  for (i = 1; i <= n; i++) print out[i]
}
AWK

FILESMODE=0
[ "$MODE" = "files" ] && FILESMODE=1
findings=$(collect | awk -v filesmode="$FILESMODE" "$RULES")

[ -z "$findings" ] && exit 0
count=$(printf '%s\n' "$findings" | wc -l | tr -d ' ')
report=$(
  echo "check-diff: $count possible problem(s) in added lines. Signals, not verdicts: fix each one,"
  echo "or, if it is a false alarm, add a comment containing \"check-diff: ok <reason>\" on that line."
  printf '%s\n' "$findings"
)

if [ "$MODE" = "hook" ]; then
  # Claude Code reads hook feedback from JSON on stdout. "additionalContext" reaches
  # Claude as context, not as a failed hook. The text is JSON-escaped by hand (no jq).
  escaped=$(printf '%s' "$report" | awk '
    { gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); gsub(/[\001-\037]/, "")
      printf "%s%s", (NR > 1 ? "\\n" : ""), $0 }')
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$escaped"
  exit 0
fi
printf '%s\n' "$report" >&2
exit 1
