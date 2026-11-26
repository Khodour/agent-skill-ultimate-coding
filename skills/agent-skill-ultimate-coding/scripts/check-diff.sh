#!/usr/bin/env bash
# check-diff: flags known dangers in the lines a change ADDS (string-built SQL,
# TLS checks turned off, secrets in code, swallowed errors, I/O inside loops, ...),
# and safety checks a change REMOVES without adding back (access checks, raised
# errors, error handlers, validation).
#
# Why it exists: agents (weak models above all) agree with written rules and then
# write the usual code anyway. A tool's output is followed far more reliably than
# prose, so the Verify step runs this and the Claude Code plugin runs it after
# every file edit (hooks/hooks.json).
#
# It only reads the lines a change touches, so old code in the project creates no
# noise. Every finding is a signal, not a verdict: fix it, or list a false alarm in
# the report with why. A team that wants a false alarm silenced for good can add a
# comment containing "check-diff: ok <reason>" on that line, or, for a removed
# check, "check-diff: ok removed-guard <reason>" anywhere in that file.
# Studies of repeated AI edits found later edits quietly delete defensive code;
# that is why removals are checked too.
#
# Usage:
#   check-diff.sh                 changed lines vs HEAD, plus new untracked files
#   check-diff.sh <base>          lines this branch changes since it left <base>, e.g. main
#   check-diff.sh --files a b     every line of the given files (no git needed, so
#                                 removed checks cannot be seen)
#   check-diff.sh --hook          Claude Code hook: checks the edited file named in
#                                 the hook JSON on stdin (its uncommitted changes)
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
  -h|--help) sed -n '2,29p' "$0"; exit 0 ;;
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
  # The value may hold JSON escapes (\" and \\ in names, \/ in paths); undo them.
  path=$(printf '%s' "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"([^"\\]|\\.)*"' | head -1 |
         sed -E 's/^"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//; s/\\"/"/g; s/\\\//\//g; s/\\\\/\\/g')
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

# Prints the change's added and removed lines as a unified diff with no context.
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
# A config value that looks like a real secret: 8+ characters with no spaces, mixing
# letters and digits (so "true", "3600000" and "Enter your password" are not flagged).
function secretish(v) {
  sub(/[ \t]*(#.*)?$/, "", v); gsub(/^["']|["']$/, "", v)
  return length(v) >= 8 && v !~ /[ \t]/ && v ~ /[A-Za-z]/ && v ~ /[0-9]/
}
function code_ext(p,    e) {
  e = p; sub(/^.*\./, "", e); return tolower(e)
}
# True when the line is a whole-line comment in the current file's language.
function is_comment(l) {
  return (hash_lang && l ~ /^[ \t]*#/) || (slash_lang && l ~ /^[ \t]*(\/\/|\/\*|\*)/) ||
         (dash_lang && l ~ /^[ \t]*--/) || (quote_lang && l ~ /^[ \t]*'/)
}
# The kind of safety check a line holds ("access check", "raised error",
# "validation"), or "" for none; the first matching kind wins. Also sets gtok, the
# check's name (the decorator or function called, or the error raised), so a check
# that a change folds into a helper or moves elsewhere can be recognised by name.
# Removed error handlers are not checks: without one, errors get louder, not quieter.
# Words inside string literals (log messages) and lines with no code punctuation
# (docstring prose) do not count; neither does a definition such as
# "def validate_x(...):", since removing the calls is what weakens a check.
function guard_kind(l,    lc, t, code) {
  gsub(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/, "\"\"", l)
  if (l ~ /^[ \t]*(export[ \t]+|async[ \t]+|static[ \t]+|public[ \t]+|private[ \t]+|protected[ \t]+)*(def|function|func|fn|fun)[ \t]/ ||
      (l ~ /^[ \t]*(async[ \t]+|static[ \t]+|public[ \t]+|private[ \t]+|protected[ \t]+)*[A-Za-z_$][A-Za-z0-9_$]*[ \t]*\([^)]*\)[ \t]*\{[ \t]*$/ &&
       l !~ /^[ \t]*(if|for|while|switch|catch|with|elif|else|return)[ \t(]/))
    return ""
  code = (l ~ /[(@=!?{;:[]/)                     # "[" last: "[=" would open an awk class
  lc = tolower(l)
  if (code && match(lc, /login_required|permission_required|user_passes_test|preauthorize|@secured|rolesallowed|\[authorize|authoriz[a-z_]*[!(]|authenticat[a-z_]*[!(]|before_action[ \t]+:(authenticate|authorize|require)|require[s_]?_?(auth|login|admin|role|permission|user)[a-z_]*|ha[sv]e?_?perm[a-z_]*|check_?perm[a-z_]*|(^|[^a-z0-9_])can(not)?[?(]|is_?admin|is_?authenticated|verify_?(token|signature|csrf|jwt|hmac|webhook)|csrf_protect|protect_from_forgery|ratelimit|rate_limit|throttl[a-z_]*|limiter\.|(owner|user)[_.]?id[ \t]*(==|!=)|(==|!=)=?[ \t]*[a-z0-9_.]*(owner|user)[_.]?id([^a-z0-9_]|$)/)) {
    gtok = substr(lc, RSTART, RLENGTH); gsub(/[^a-z0-9_]/, "", gtok); return "access check"
  }
  # raise/throw only where a statement can start, so prose in docstrings ("it would
  # never raise on bad input", ":raises X:") is not taken for code.
  if (match(l, /(^[ \t]*|[;{}:)][ \t]*|(\|\||&&|\?\?|=>|[^A-Za-z0-9_](or|and|then|else|do))[ \t]+)(raise|throw)([ \t(;]|$)/)) {
    t = substr(l, RSTART + RLENGTH); sub(/^[ \t(]*(new[ \t]+)?/, "", t)
    gtok = (match(t, /^[A-Za-z_][A-Za-z0-9_.:]*/) ? substr(t, 1, RLENGTH) : "raise"); return "raised error"
  }
  if (match(l, /raise_for_status\(|(^|[^A-Za-z0-9_.])(panic|die)\(|(^|[^A-Za-z0-9_])abort\([ \t]*4|return[ \t]+(nil,[ \t]*)?err([ \t;,)]|$)|return[ \t].*(Errorf|errors\.New|Err)\(|(status|status_code|StatusCode)[ \t]*(\(|=|:)[ \t]*4[0-9][0-9]|Http(Response)?(Forbidden|BadRequest|NotFound|Unauthorized)|PermissionDenied|AccessDenied|(^|[^A-Za-z0-9_])(Forbidden|Unauthorized|BadRequest)\(/)) {
    gtok = substr(l, RSTART, RLENGTH); gsub(/[^A-Za-z0-9_]/, "", gtok); return "raised error"
  }
  if (code && match(l, /(^|[^A-Za-z0-9_.])assert[ \t(]|[A-Za-z_]*[Vv]alidat[A-Za-z_]*\(|is_valid\(|full_clean\(|safeParse\(|[Ss]anitiz[A-Za-z_]*\(/)) {
    gtok = substr(l, RSTART, RLENGTH); gsub(/[^A-Za-z0-9_]/, "", gtok); return "validation"
  }
  return ""
}
BEGIN { n = 0; nr = 0 }
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
    skip = skip || file ~ /(^|\/)(node_modules|bower_components|vendor|dist|build|coverage|site-packages|\.?venv|\.next|\.git|Pods|Carthage|DerivedData|\.build|obj|target|\.gradle|\.dart_tool|_build|deps)\// \
          || file ~ /\.(lock|min\.js|map|svg|png|jpe?g|gif|pdf|ico|woff2?|md|mdx|txt|rst|adoc|csv|tsv)$/ \
          || file ~ /(package-lock|yarn\.lock|pnpm-lock|packages\.lock\.json|Package\.resolved|go\.sum|gradle\.lockfile)/ \
          || file ~ /\.(g|designer|generated)\.cs$|\.pb\.go$|_pb2\.py$|\.pbxproj$/ \
          || file ~ /check-diff/
  ext = code_ext(file); loop = 0; prevnum = -9; prevtxt = ""
  hash_lang  = (ext ~ /^(py|rb|sh|bash|zsh|pl|r|ex|exs|cr|jl|nim|ps1|psm1|coffee|tf|cmake|yml|yaml|toml|properties|conf|ini)$/)
  slash_lang = (ext ~ /^(js|jsx|ts|tsx|mjs|cjs|go|java|kt|kts|cs|c|cc|cpp|cxx|h|hpp|hh|m|mm|swift|rs|scala|php|dart|groovy|gradle|fs|fsx|sol|zig)$/)
  dash_lang  = (ext ~ /^(sql|lua|hs|elm|ada|adb|ads)$/)
  quote_lang = (ext ~ /^(vb|vbs|bas)$/)
  markup     = (ext ~ /^(html?|xhtml|jinja2?|j2|njk|hbs|handlebars|mustache|erb|haml|slim|twig|liquid|ejs|jsp|cshtml|razor)$/)
  # With --files and an absolute path, only the file name counts: a project that
  # lives under some folder named "tests" must not lose its checks.
  tpath = file; if (filesmode && tpath ~ /^\//) sub(/^.*\//, "", tpath)
  testfile = (tolower(tpath) ~ /(^|\/)(tests?|spec|__tests__|fixtures?)\/|[._-](test|spec)\.[a-z]+$|(^|\/)test_[^\/]*\.py$|(^|\/)tests\.py$/ ||
              tpath ~ /[a-z0-9]Tests?\.[A-Za-z]+$/)
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
  if (l ~ /check-diff: ok removed-guard/) ackfile[file] = 1
  # Acknowledged false alarms, and minified or bundled lines nobody writes by hand.
  if (l ~ /check-diff: ok/ || length(l) > 400) { prevnum = lnum; prevtxt = l; next }
  lc = tolower(l)
  match(l, /^[ \t]*/); ind = RLENGTH
  comment = is_comment(l)
  # Safety checks this change adds, to balance the ones it removes (see END).
  if (!comment && !testfile && !markup && (k = guard_kind(l)) != "") { addf[file SUBSEP k]++; addtok[k SUBSEP gtok] = 1 }

  # Data never becomes code (MUST 1).
  if (!comment && lc ~ /(select[ \t].*[ \t]from[ \t]|insert[ \t]+into[ \t]|update[ \t].*[ \t]set[ \t]|delete[ \t]+from[ \t])/ &&
      lc ~ /["'`][ \t]*(\+|\.\.|\|\||&[ \t]*[a-z_])|\+[ \t]*["'`]|\$\{|#\{|\$@?"|@\$"|\\\(|withformat:|format!\(|::format\(|\.formatted\(|\.format\(|["'][ \t]*%[ \t]*[(A-Za-z_]|(^|[^A-Za-z0-9_])f["']|sprintf\(|(=|<|>|[ \t]in|[ \t]like|values)[ \t]*\(?[ \t]*'?\$[A-Za-z_]|["'][ \t]*\.[ \t]*[$A-Za-z_]/)
    if ((lc ~ /["'`][ \t]*(select|insert|update|delete|with)[ \t]/ || lc ~ /(query|execute|exec|raw|sql|prepare|statement|stmt)[a-z_]*[ \t]*(\(|=|:=)/) &&
        !(lc ~ /(^|[^a-z0-9_])(log|logger|logging|console|print|println|printf|puts|echo|warn|info|debug|trace)[a-z]*[ \t]*[.(]/ && lc !~ /(query|execute|exec|raw|prepare)[a-z_]*[ \t]*\(/))
      flag("sql-string", "SQL built from strings -> pass values as query parameters (MUST 1)")
  if (!comment && (l ~ /(^|[^.>A-Za-z0-9_])(eval|exec|shell_exec|passthru)\(|new[ \t]+Function\(|shell[ \t]*=[ \t]*True|os\.(system|popen|execute)\(|Runtime\.getRuntime\(\)\.exec\(|loadstring\(|Code\.eval_(string|quoted)\(/ ||
      l ~ /["'](sh|bash|zsh|cmd|cmd\.exe|powershell|pwsh)["'][ \t]*[,)][^;]*(["'](-c|\/c)["'][ \t]*[,)][ \t]*(\.arg\([ \t]*)?[A-Za-z_$]|["'](-c|\/c)[ \t][^"']*["'][ \t]*\+)/ ||
      l ~ /(^|[^.>A-Za-z0-9_:])(system|popen|execSync)\([ \t]*([A-Za-z_$][A-Za-z0-9_]*[ \t]*\)|[^)]*(#\{|\$\{|["'`][ \t]*(\+|\.|&)))/ ||
      lc ~ /(^|[ \t;|(])(invoke-expression|iex)[ \t]/))
    flag("dynamic-code", "code or a shell string built at runtime -> use an argument list or a safe API (MUST 1)")
  if (l ~ /innerHTML[ \t]*\+?=|outerHTML[ \t]*=|dangerouslySetInnerHTML|document\.write\(|mark_safe\(|\|[ \t]*safe[ \t]*\}|v-html=|\.html_safe/ || (file ~ /\.blade\.php$/ && l ~ /\{!!/) ||
      l ~ /Html\.Raw\(|\[innerHTML\][ \t]*=|bypassSecurityTrust(Html|Script|Url|ResourceUrl)\(|\{@html[ \t]|template\.(HTML|JS)\(|\|[ \t]*raw[ \t]*(\}|\|)|<%==|\{\{\{|th:utext=|loadHTMLString|echo[ \t]+\$_(GET|POST|REQUEST|COOKIE)/ ||
      l ~ /\.loadData(WithBaseURL)?\([^)]*text\/html/)
    flag("raw-html", "raw HTML from data -> escape it or use text APIs (MUST 1)")

  # Never weaken a safety check (MUST 5) or open access (MUST 2).
  if (l ~ /verify[ \t]*=[ \t]*False|rejectUnauthorized["']?[ \t]*:[ \t]*false|InsecureSkipVerify[ \t]*:[ \t]*true|NODE_TLS_REJECT_UNAUTHORIZED|SSL_VERIFYPEER[^;]*(0|false|FALSE)|_create_unverified_context|CERT_NONE|TrustAll|trustAll/ ||
      l ~ /curl[^|;]*[ \t](-k|--insecure)([ \t]|$)/ ||
      l ~ /(Server|Remote)Certificate(Custom)?ValidationCallback.*(=>|\{)[ \t]*\$?true|DangerousAcceptAnyServerCertificateValidator|[Hh]ostname[Vv]erifier[^;]*->[ \t]*true|NoopHostnameVerifier|ALLOW_ALL_HOSTNAME_VERIFIER|VERIFY_NONE|verify:[ \t]*:verify_none/ ||
      l ~ /["']verify_peer(_name)?["'][ \t]*=>[ \t]*false|danger_accept_invalid_(certs|hostnames)\([ \t]*true|badCertificateCallback[^;]*=>[ \t]*true|usesCleartextTraffic="true"|cleartextTrafficPermitted="true"/ ||
      (l ~ /NSAllowsArbitraryLoads/ && l !~ /<false\/>/))
    flag("tls-off", "TLS verification turned off -> fix the certificate or CA bundle instead (MUST 5)")
  if (l ~ /chmod[ \t]+(-R[ \t]+)?0?777|0o777|0777/)
    flag("open-perms", "world-writable permissions -> grant the least access that works (MUST 5)")
  if (l ~ /csrf_exempt|csrf\.exempt|csrf\(\)\.disable|csrf[ \t]*:[ \t]*false|Access-Control-Allow-Origin["']?[ \t]*[,:][ \t]*["']\*|origin[ \t]*:[ \t]*["']\*["']|AllowAnyOrigin|AllowAny([^A-Za-z]|$)|SetIsOriginAllowed\([^)]*=>[ \t]*true|permitAll\(\)/)
    flag("safety-off", "CSRF, CORS or access check opened -> keep it on and allow only what is needed (MUST 2, 5)")

  # Secrets stay outside code (MUST 4).
  if ((lc ~ /(api[_-]?key|secret|passw(or)?d|token|private[_-]?key|access[_-]?key)["']?[ \t]*(:[ \t]*[a-z_&'][a-z0-9_<>?&' ]*)?(:|=|:=|=>)[ \t]*@?["'][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t][^"' \t]/ &&
       !testfile && lc !~ /env|getenv|environ|example|changeme|xxxx|placeholder|dummy|your[_-]|<|\$\{|\{\{/) ||
      l ~ /AKIA[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]|xox[abposr]-[A-Za-z0-9]|(^|[^A-Za-z0-9_-])sk-[A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-]/)
    flag("secret", "secret written in code -> read it from the environment or a secret store; rotate it if it was ever committed (MUST 4)")
  else if (!testfile && lc !~ /env|example|changeme|xxxx|placeholder|dummy|your[_-]|\$\{|\$\(|\{\{/ &&
           ((ext ~ /^(yml|yaml|properties|env|ini|conf|toml)$/ &&
             match(lc, /^[ \t]*[a-z0-9_.-]*(api[_-]?key|secret|passw(or)?d|token|private[_-]?key|access[_-]?key)[a-z0-9_.-]*[ \t]*[:=][ \t]*/) &&
             secretish(substr(l, RSTART + RLENGTH))) ||
            (match(lc, /<string>[^<]*<\/string>/) && secretish(substr(l, RSTART + 8, RLENGTH - 17)) &&
             (lc ~ /<key>[^<]*(api[_-]?key|secret|passw|token|private[_-]?key|access[_-]?key)[^<]*<\/key>/ ||
              (lnum == prevnum + 1 && tolower(prevtxt) ~ /<key>[^<]*(api[_-]?key|secret|passw|token|private[_-]?key|access[_-]?key)[^<]*<\/key>/)))))
    flag("secret", "secret written in config -> read it from the environment or a secret store; rotate it if it was ever committed (MUST 4)")

  # Never hand-roll auth or crypto (MUST 3).
  if (!comment && !testfile && lc ~ /passw|token|secret|otp|salt|nonce|reset|session/ &&
      (lc ~ /md5|sha1([^0-9]|$)/ || l ~ /Math\.random\(|random\.(random|randint|choice|choices)\(|(^|[^A-Za-z_])rand\(\)|mt_rand\(|new Random\(|uniqid\(|ThreadLocalRandom|Random\.next(Int|Long|Double|Bytes)\(|(^|[^A-Za-z_.])Random\(\)\.next|rand\.(Intn|Int63n?|Int31n?|Float64|Uint32|Uint64|Perm)\(|(^|[^A-Za-z_.:])rand\([0-9]/))
    flag("weak-secret", "weak hash or predictable random for a secret -> use the platform's password hasher or secure random (MUST 3)")

  # Fix the cause, never swallow it (MUST 12). One-line forms here, two-line forms below.
  if (l ~ /rescue[ \t]+nil([^A-Za-z_]|$)|rescue[ \t]+_[ \t]*->[ \t]*(nil|:ok)|^[ \t]*pcall\(/ ||
      lc ~ /on[ \t]+error[ \t]+resume[ \t]+next/ || (ext == "rs" && l ~ /\.ok\(\)[ \t]*;[ \t]*$/) ||
      l ~ /^[ \t]*except([ \t(][^:]*)?:[ \t]*(pass|\.\.\.)[ \t]*(#.*)?$|catch[ \t]*(\([^)]*\))?[ \t]*\{[ \t]*\}|\.catch\([ \t]*(\([^)]*\)|[A-Za-z_]*)[ \t]*=>[ \t]*(\{[ \t]*\}|null|undefined)[ \t]*\)|(^|[^A-Za-z0-9_])rescue[^;]*;[ \t]*end|(^|[^A-Za-z_])_[ \t]*=[ \t]*err([^A-Za-z]|$)/)
    flag("swallowed-error", "error swallowed -> handle it, or log it and re-raise (MUST 12)")
  else if (!testfile && ext == "go" && l ~ /,[ \t]*_[ \t]*:?=[ \t]*[A-Za-z_][A-Za-z0-9_.]*[A-Za-z0-9_]\(/)
    flag("swallowed-error", "error thrown away with _ -> check it, or return it (MUST 12)")
  else if (lnum == prevnum + 1 && prevtxt ~ /^[ \t]*except([ \t(][^:]*)?:[ \t]*$|catch[ \t]*(\([^)]*\))?[ \t]*\{[ \t]*$|^[ \t]*rescue([ \t].*)?$/ && l ~ /^[ \t]*(pass|\.\.\.|\}|end)[ \t]*$/) {
    lnum--; flag("swallowed-error", "error swallowed -> handle it, or log it and re-raise (MUST 12)"); lnum++
  }

  # Never weaken a test (MUST 10).
  if (l ~ /\[(Fact|Theory)\([^]]*Skip[ \t]*=|\[Ignore[](]|XCTSkip|@Test\([^)]*\.disabled|#\[ignore([^A-Za-z]|$)|markTest(Skipped|Incomplete)\(|@tag[ \t]+:skip|(^|[^A-Za-z0-9_.])x(it|describe|context|specify)[ \t]+["']/ ||
      (testfile && l ~ /^[ \t]*(skip|pending)([ \t]+["']|\(|[ \t]*$)|skip:[ \t]*(true|["'])/) ||
      l ~ /(^|[^A-Za-z0-9_])(it|describe|test|context)\.(only|skip)\(|(^|[^A-Za-z0-9_.])(fit|fdescribe|xit|xdescribe|xtest)\(|@pytest\.mark\.(skip|xfail)([^a-z]|$)|@unittest\.skip|@Disabled|@Ignore|t\.Skip\(/)
    flag("skipped-test", "test skipped or focused -> run every test; fix the test or the code (MUST 10)")

  # Exact money (references/correctness.md).
  lm = lc
  gsub(/(price|amount|total|cost|balance|money|fee|tax|salary|payment|refund)_?(width|height|size|length|offset|padding|margin|radius|duration|count|time|seconds|distance|scale|angle|opacity|alpha|frames|pixels|items|rows|pages|steps|weight|lines|scrolled)/, "", lm)
  if (!comment && lm ~ /price|amount|total|cost|balance|money|fee|tax|salary|payment|refund/ &&
      l ~ /parseFloat\(|(^|[^A-Za-z_])[fF]loat\(|toFixed\(|(^|[^A-Za-z_])(double|Double|float|Float|f32|f64|float64)([^A-Za-z_0-9]|$)/)
    flag("float-money", "money in binary floating point -> integer cents or a decimal type (correctness.md)")

  # Clean code (structure.md): no leftovers.
  if (l ~ /(^|[^A-Za-z_])debugger[ \t]*;?[ \t]*$|breakpoint\(\)|pdb\.set_trace|binding\.(pry|irb)|var_dump\(|Debugger\.(Break|Launch)\(|dbg!\(|(^|[^A-Za-z_.])byebug([^A-Za-z_]|$)|(^|[^A-Za-z0-9_>:$.])dd\(|IEx\.pry|(^|[^A-Za-z_.])debugger\(\)/)
    flag("debug-leftover", "debugger or dump left in -> remove it")
  if (l ~ /(TODO|FIXME|HACK)([^A-Za-z]|$)/)
    flag("todo", "TODO added -> fix it now, or list it in the report (no silent TODOs)")
  # Commented-out code: the comment's text has the shape of a statement, not prose.
  c = l; sub(/^[ \t]*(\/\/|#|--|')[ \t]*/, "", c)
  if (comment && (c ~ /^(const|let|var|val|local|Dim|dim)[ \t]+(mut[ \t]+)?[A-Za-z_$][A-Za-z0-9_$]*[ \t]*(:[^=]*)?=/ ||
                  c ~ /^[A-Za-z_][A-Za-z0-9_, ]*[ \t]*:=[ \t]*[^ \t]/ ||
                  c ~ /^\[[A-Za-z_][A-Za-z0-9_.]*[ \t]+[A-Za-z_][^]]*\];[ \t]*$/ ||
                  c ~ /^[A-Za-z_][A-Za-z0-9_<>,.]*[*]?[ \t]+[*]?[A-Za-z_][A-Za-z0-9_]*[ \t]*=[ \t]*[^= \t].*;[ \t]*$/ ||
                  c ~ /^[A-Za-z_$][A-Za-z0-9_$.]*\(.*\);[ \t]*$/ ||
                  c ~ /^(if|for|while)[ \t]*\(.*\)[ \t]*\{[ \t]*$/ ||
                  c ~ /^(def|function|func|fn|fun)[ \t]+[A-Za-z_$][A-Za-z0-9_$]*[ \t]*\(/ ||
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
           ((l ~ /await[ \t]|\.await([^A-Za-z_]|$)/ && lc ~ /(^|[^a-z0-9_])(db|repo|repository|client|api|http|prisma|knex|sequelize|mongoose|model|session|conn|pool|store|redis|cache|supabase|firestore|s3|queue|fetch|axios)[a-z0-9_]*(\.|::|\()/) || l ~ /\.(Query|QueryRow|QueryContext|QueryRowContext|Exec|ExecContext)\(|(^|[^A-Za-z0-9_])[A-Z][A-Za-z0-9]*(\.|::)(find|find_by|where|first|query)\(|\.query\(|\.execute\(|\.objects\.|\.find(One|By[A-Za-z]*|_by|All)\(|\.(save|first|get_or_create)\(|fetch\(|axios\.|requests\.(get|post|put|patch|delete)\(|http\.(Get|Post|Do)\(|DB::/)) {
    flag("io-in-loop", "query or network call inside a loop (N+1) -> fetch everything in one query or call before the loop (performance.md)")
    loopflagged = 1
  }
  if (!comment && l ~ /^[ \t]*(for|while)([ \t(]|$)|\.forEach\(|\.each[ \t]+do|\.each[ \t]*\{|foreach[ \t]*\(|for[ \t]+[A-Za-z_, ]+[ \t]+in[ \t]/) {
    loop = 1; loopind = ind; loopflagged = 0
  }

  prevnum = lnum; prevtxt = l
  next
}
# Removed lines: remember each safety check, judged in END once every added line
# is known. Deleted files are skipped by "skip" (their "+++" is /dev/null): removing
# a whole dead module is not weakening anything. Test files are left to MUST 10, and
# templates and markup only show or hide things, which is not the server check MUST 2 means.
/^-/ {
  if (skip || testfile || markup) next
  l = substr($0, 2); sub(/\r$/, "", l)
  if (length(l) > 400 || is_comment(l)) next
  if ((k = guard_kind(l)) != "") {
    nr++; rfile[nr] = file; rline[nr] = lnum + 1; rkind[nr] = k; rtok[nr] = gtok
    remf[file SUBSEP k]++
  }
  next
}
END {
  for (i = 1; i <= n; i++) print out[i]
  # A removed check is fine when its file adds as many checks of that kind as it
  # removes (moved, reworded, re-indented), or when a check of the same name is added
  # anywhere in the change (folded into a helper, moved to another file). Kinds alone
  # are not balanced across files: an unrelated new check elsewhere must not hide a loss.
  for (i = 1; i <= nr; i++) {
    f = rfile[i]; k = rkind[i]
    if (ackfile[f] || remf[f SUBSEP k] <= addf[f SUBSEP k] || ((k SUBSEP rtok[i]) in addtok)) continue
    if (k == "access check") must = "(MUST 2, 5)"; else if (k == "validation") must = "(MUST 5)"; else must = "(MUST 12)"
    print f ":" rline[i] "  [removed-guard] " k " removed and not added back -> keep it; if it is truly not needed, say why in your report " must
  }
}
AWK

FILESMODE=0
[ "$MODE" = "files" ] && FILESMODE=1
findings=$(collect | awk -v filesmode="$FILESMODE" "$RULES")

[ -z "$findings" ] && exit 0
count=$(printf '%s\n' "$findings" | wc -l | tr -d ' ')
report=$(
  echo "check-diff: $count possible problem(s) in this change. Signals, not verdicts: fix each real one."
  echo "A false alarm: leave the code as it is and list it in your report, one line with why."
  printf '%s\n' "$findings"
)

if [ "$MODE" = "hook" ]; then
  # Claude Code reads hook feedback from JSON on stdout. "additionalContext" reaches
  # Claude as context, not as a failed hook. The text is JSON-escaped one character
  # at a time by string joining (gsub treats backslashes differently between awks),
  # so a file name holding " or \ can never break out of the string. Control bytes
  # become \u00XX; non-ASCII bytes become "?" so the output is always valid JSON.
  escaped=$(printf '%s' "$report" | awk '
    BEGIN { for (i = 1; i < 32; i++) ctl[sprintf("%c", i)] = sprintf("\\u%04x", i)
            for (i = 128; i < 256; i++) high[sprintf("%c", i)] = 1 }
    { if (NR > 1) out = out "\\n"
      for (i = 1; i <= length($0); i++) {
        c = substr($0, i, 1)
        if (c == "\\") out = out "\\\\"
        else if (c == "\"") out = out "\\\""
        else if (c in ctl) out = out ctl[c]
        else if (c in high) out = out "?"
        else out = out c
      } }
    END { printf "%s", out }')
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$escaped"
  exit 0
fi
printf '%s\n' "$report" >&2
exit 1
