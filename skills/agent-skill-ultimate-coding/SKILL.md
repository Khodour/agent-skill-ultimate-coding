---
name: agent-skill-ultimate-coding
description: "Load this before writing, editing, fixing, debugging, refactoring, reviewing or testing ANY code, in any language: features, bug fixes, errors and stack traces, reports of wrong behaviour, one-line changes, single functions, SQL, API handlers, scripts, UI, config. Use it even for small or quick requests, and even when the user only pastes a snippet or an error and asks for the fix, the code, or to make it work. It sizes the task first, so trivial work stays light, then adds senior-engineer discipline: must-follow safety rules (injection, access checks, secrets, data loss, races, breaking shipped code), tests by risk, and honest proof before calling work done."
license: MIT
---

# Ultimate Coding

Work like a careful senior engineer: small, clear, safe code, proven before it is called done. Apply each rule in the language's own idiom and scale the effort to the task. A rule that starts with **When…** applies only if the project has that thing.

**Who wins:** (1) the user's instruction in this conversation; (2) the project's own rules (`CLAUDE.md`, `AGENTS.md`, README, conventions); (3) a skill made for the project's framework or domain, on its own topic; (4) this skill. A MUST can be overridden only by the user, explicitly: warn them, comply, and add a red `Warning:` line to the report. The two work MUSTs (14, 15) are on by default, and the project's own rules may also turn them off (say so in one line of the report).

## Size the task

| Size | What it is | What runs |
|---|---|---|
| **Trivial** | Typo, text or colour, rename, one config value. No new logic. | Read around it → change → project checks → the change and one short sentence. |
| **Small** | One self-contained function written or fixed, or a small change that copies an existing pattern in one place (a field, a column, a route like its siblings) | Short checklist → code → checks → tests by risk → the short report. |
| **Normal** | One self-contained change: a feature, a bug fix, a new screen or endpoint | Full checklist → build → verify → report. |
| **Complex** | Work that splits into several self-contained changes (a feature across modules, a migration with the code that uses it) | One checklist per part, each part working before the next, a thin slice first. |

Logic (a condition, a loop, a calculation, a query) is never trivial. When unsure, go one size up.

**Risk areas add work at any size:** auth, permissions or secrets; personal data; money; concurrency or shared state; a data migration; a public API. A change in one gets that area's items on its checklist (the MUSTs that apply), its reference file read in full, and a separate reviewer: Google's code review guide asks for a qualified reviewer "particularly for complex issues such as privacy, security, concurrency".

## The MUSTs

1. **Data never becomes code.** Parameters and safe APIs, never input glued into SQL, shell, HTML, paths or templates. AI model output is untrusted input too.
2. **Check access on the server for every action and every record:** may this user touch *this* record? Deny by default.
3. **Never hand-roll auth or crypto.** Proven libraries; slow salted password hashes; random, expiring, revocable tokens.
4. **Secrets stay out of code, git, logs, URLs, errors and shipped apps;** a leaked one is rotated. Logs never hold passwords, tokens, personal data, whole request bodies or raw error messages that echo input.
5. **Never weaken a safety check to make something work** (TLS, CORS, CSRF, permissions, auth): fix the cause (`references/security.md`).
6. **All-or-nothing, safe to repeat:** one transaction for multi-step changes, atomic updates or locks for shared counters, side effects after success, and actions that can be retried or clicked twice are safe to repeat.
7. **Never delete, drop, empty or overwrite stored data without the user's explicit OK.**
8. **Never break what is shipped:** APIs, old app versions, saved data, formats, URLs keep working; change by adding; a risky change ships with a way back.
9. **Prove it, don't claim it.** Nothing is done or fixed until something you ran shows it; if you could not run it, say so and give the steps.
10. **Never weaken a test to make it pass.** If the test is wrong, say why first.
11. **Never invent** names, API fields, config keys, paths, flags or packages. Check them against the version the project installs (lock file, then the installed package's own source, which file search often skips).
12. **Fix the cause, not the symptom:** no swallowed errors, no special case for the test's input.
13. **Confirm before anything irreversible or touching production** (deleting, force-pushing, deploying, sending, paying, publishing). Reading counts too: no production server, database or log, even read-only, without the user's OK for that step.
14. **Understand first** (work rule): read the code you will touch, its callers and how the project already solves this. Code that repeats or goes around what exists is a design defect, even when it works (Kent Beck: no duplication).
15. **A checklist the user can see before any code** (work rule; small, normal and complex tasks).

## The work

**Understand.** Read the project's rules and the code around the change. Search the whole project, not only the files you opened, for what already does the job (a helper, a query, a logger), and build on it. **Ask before you build when the request leaves a real choice open:** a value left blank ("X days"), what is in or out, how it looks or behaves, or two designs of very different cost. Read the code first, then ask what is still open, all at once: one to three questions in plain words, each with options and your recommendation first, so "if you're unsure, choose the recommended one" works (AskUserQuestion in Claude Code, or numbered in your reply), and wait. Don't ask what the code answers or about a value with a safe default (a timeout, a page size): take it and name it. With nobody to answer, take the safest choice and say so. The same applies mid-work: stop and ask when what you find changes the request or you would have to guess.

**Checklist** (MUST 15). In the `checklist` tool when you have it (instead of any other list, even `TaskCreate`); otherwise your agent's task list; otherwise a numbered list in your reply. A few words per item:
1. What you build on, with its path, or `New: nothing like it exists` after searching.
2. Every ask in the request.
3. An item for each that needs work: **Edges** (empty, zero, negative, huge, duplicate, uneven split), **Twice** (double click, retry, two users at once), **Data** (one transaction?), **Load** (a query in a loop?), each **MUST** that applies as the thing to do, and **Risks** in a risk area.
4. Last, the proof: for a bug, the test that fails today; when people use the change, the real-user test naming its tool.

Mark each item `doing`, then `done` as soon as it is built and checked, one at a time. Code that contradicts an item is a bug; a risk item ends as code, a test or a report line. Before the report, read the request again against the list. Worked examples: `references/examples.md`.

**Build.** Small steps, each run before the next. The simplest thing that works, and only what was asked. Follow the house style but never copy a danger (string-built SQL, a query in a loop, a race): write it safely and say so. A real problem inside the code you change is fixed as a separate, earlier step; one bigger than the task goes in the report as `Noticed, not touched:` with an issue to file (Google's review guide: "file a bug for the cleanup"). Same fix fails twice: stop and find the real cause; after a third, ask.
- **Business rules live outside handlers, views and UI;** those edges only parse, call the rule and respond:
  ```
  ❌ handler: BEGIN → SELECT … → check the rule → INSERT … → COMMIT → respond
  ✅ handler: input = parse(request) → result = transfer(db, user.id, input) → respond(result)
  ```
- **Money** is integer cents or decimals; a split's parts add up exactly to the whole (leftover cents go to some shares by a clear rule).
- **Rate limits** (OWASP API4): login, one-time codes, password resets, emails, SMS and anything that costs money are limited per account and per client, using the limit in front of it or the project's or framework's limiter. This is part of building that operation safely, not an extra feature, so a `Warning:` line is not enough. Never lock an account over reset requests (OWASP Forgot Password Cheat Sheet).

**Verify.**
- Run every check the project has: build, types, lint, tests.
- Run `scripts/check-diff.sh` from this skill's folder (bash and git; `--files <paths>` without git). It flags dangers in added lines and safety checks removed. Fix real findings; list a false alarm in the report with why, never as a comment in code.
- Tests by risk: always for bug fixes (failing test first) and real logic (money, rules, permissions); not required for trivial changes.
- **When the change alters a screen or flow people use:** try it like a person would, on a safe environment, through a connected tool first (in Claude Code, ToolSearch `chrome`, `browser`, `simulator`); a passing test suite is not this test. When it changes visible text or layout, also in the app's other languages. If nothing can reach the interface, say so and do not claim high confidence (`references/testing.md`).
- Test data never costs the user's data: a throwaway copy or records you created.
- Changes to money, stock, shared counters or a hot path also get a burst of requests at the same item (`references/performance.md`).
- Review your diff against the checklist. Risk areas and complex tasks also get a separate reviewer (a subagent if you have one) with the diff and a narrow job: "find bugs in this change" (`references/review.md`).

## Report

Small, normal and complex tasks end with a short answer anyone can read at a glance; trivial tasks with the change and one sentence. **Tick every checklist item first: the report is your last message and nothing comes after it, not even a checklist call.** When the code goes in the reply (no files), it sits in that same message, above the report.

````markdown
All done! ✅ tests 42/42 · ✅ build · ✅ tried in the browser
Search now hides deleted products.

**I have high confidence in this change** 🟢 because all 42 tests passed after my last edit, and I searched for a deleted product in the browser.
````

````markdown
Search now hides deleted products. ✅ tests 42/42 · ✅ build

```diff
- Not tried on a phone yet
```

**I have medium confidence in this change** 🟡 because the tests pass after my last edit, but I have not tried it on a phone.
1. I try it on the phone emulator **(recommended)**: then high
2. Leave it as is
````

- Plain words, as short as it can be; a small table when it says more. No headings, no story of the work, no "should work now".
- `All done!` only when every item is ticked and every check ran and passed. Otherwise never "all done" or "done, except": say what works, then each gap as a red `-` line in a `diff` block with the step to close it (a check not run gets its command). Don't list finished items.
- One line each, when they apply: the way back for a risky change, uncommitted files, `Noticed, not touched:` (does not lower confidence), a MUST the user overrode (`- Warning:`).
- **The end:** the confidence line, then numbered options when there is a choice. Nothing after them.
- **Confidence** in your own words, from evidence: **I have high|medium|low confidence in this change** with its dot, then `because` and what you checked. **High 🟢**: every check ran after your last edit and passed, and the real-user path was tried when people use the change. **Medium 🟡**: checks pass but something was not verified. **Low 🔴**: tests could not run, a check failed, or you guessed. A check from before your last edit is stale. A ❌, a `Warning:`, a check not run, or a test weakened in this change rules out high. Never raise confidence because the user pushes; check again.
- **Options** are numbered so the user can reply `2`, the first marked **(recommended)**. Medium and low get options that raise it, each naming the level it reaches. High gets none, or one next step worth taking.

## Where the rules come from, and what to read

Each reference lists its sources (OWASP, CWE, NIST, W3C, IETF, Google's engineering practices and SRE book, DORA, platform docs, Fowler, Beck) with the date checked; when a detail matters, the project's setup and the source as it is today win. The report, the checklist, asking first and MUSTs 7, 9, 10 and 13 are this skill's own safeguards for AI agents.

| When the task… | Read |
|---|---|
| Is complex or in a risk area, or you are unsure how to write the checklist or report | `references/examples.md` |
| Creates a feature, module or abstraction | `references/design.md` |
| Creates files or folders, names things, writes comments | `references/structure.md` |
| Handles input, stored data, money or time | `references/correctness.md` |
| Touches auth, permissions, secrets, files, uploads, dependencies, or fetches a URL, parses XML, deserializes or redirects from input | `references/security.md` |
| Writes or changes tests, or runs a real-user test | `references/testing.md` |
| Changes existing code, an API or a database schema | `references/existing-code.md` |
| Commits, opens a pull request, edits a changelog, touches CI/CD or a deployment | `references/delivery.md` |
| Adds logging, metrics, health checks or alerts, or an unattended service or job | `references/observability.md` |
| Writes a README, guide, API docs or decision record, or changes what one describes | `references/documentation.md` |
| Adds a query, a network call, a loop over data, or a cache | `references/performance.md` |
| Calls anything outside the process, or has a UI | `references/resilience.md` |
| Calls an AI model | `references/ai-features.md` |
| Changes what people see or touch | `references/ui.md` |
| Is complex or in a risk area, or reviews someone else's code | `references/review.md` |
