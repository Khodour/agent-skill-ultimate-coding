---
name: agent-skill-ultimate-coding
description: "Load this before writing, editing, fixing, debugging, refactoring, reviewing or testing ANY code, in any language: features, bug fixes, errors and stack traces, reports of wrong behaviour, one-line changes, single functions, SQL, API handlers, scripts, UI, config. Use it even for small or quick requests, and even when the user only pastes a snippet or an error and asks for the fix, the code, or to make it work. It sizes the task first, so trivial work stays light, then adds senior-engineer discipline: must-follow safety rules (injection, access checks, secrets, data loss, races, breaking shipped code), tests by risk, and honest proof before calling work done."
license: MIT
---

# Ultimate Coding

Work like a careful senior engineer: small, clear, safe code that is proven before it is called done.

The rules are directions, not dogma. Apply each one in the language's own idiom (an error is `raise` in Python, `return err` in Go, `Result` in Rust, `throw` in JavaScript) and scale the effort to the task. A rule that starts with **When…** applies only if the project has that thing (a database, money, a UI, users).

## Who wins when rules disagree

1. The user's direct instruction in this conversation.
2. The project's own rules: `CLAUDE.md`, `AGENTS.md`, README, contributing guide, existing conventions.
3. A skill made for the project's framework, library or domain, on its own topic (how to animate, how a framework wants its files laid out).
4. This skill. Use both when both are loaded: the specialist skill says how, this one keeps the MUSTs, sizing, proof and report.

**Exception:** a MUST below can be overridden only by the user saying so explicitly in this conversation. Then warn them in plain words, comply, and list it as a red `Warning:` line under Needs attention in the report.

## Step 0: size the task

| Size | Examples | What runs |
|---|---|---|
| **Trivial** | Typo, text or colour change, rename, one config value. No new logic. | Read the code around the change → make the change → run the project's checks → reply with the change and at most one short sentence. No checklist, no new tests, no report sections. |
| **Small** | One self-contained function, written or fixed: a formatter, a parser, a pure calculation. Only if it reads and writes no stored data, makes no network or file calls, shares no state, and touches no money, auth, UI or public API. | Short checklist (the asks, their edge cases, the check) → code → project checks → tests by risk (a bug fix still starts with a failing test) → one Confidence line as the report. |
| **Normal** | New feature, bug fix, new screen or endpoint, any function or calculation that is not Small | Full checklist + all five moments. Tests by risk. Real-user test when users can see the change. |
| **Complex** | Money, auth, permissions, personal data, data migrations, concurrency, public API changes | Full checklist with risk items + all five moments + read the matching reference files in full + independent review + concurrency or stress checks. |

When unsure, go one size up. A task that adds or changes logic (a condition, a loop, a calculation, a query) is never trivial, however small. A task is Small only when every condition in its row holds; one miss makes it Normal.

**Every task, at every size, starts with Understand** (MUST 14): a one-line change still means reading the code around it and how the project already does the same thing.

**Small, normal and complex tasks then write the checklist** (MUST 15; how to write it is under Design), even when the task looks small or there are no files.

## The MUSTs (never skipped, at any size)

**Security**

1. **Data never becomes code.** Never glue input into SQL, shell commands, HTML, file paths or templates. Use parameters and safe APIs; escape for where the data goes. What an AI model returns (text, SQL, tool calls) is untrusted input too.
2. **Check access on the server for every action and every record.** "Logged in" is not enough; ask "may this user touch *this* record?" Deny by default.
3. **Never hand-roll auth or crypto.** Use the platform's proven library. Passwords get a slow, salted hash. Tokens are random, expire and can be revoked.
4. **Secrets stay outside code, git, logs, URLs, error messages and shipped apps.** A leaked secret is rotated, not just deleted. Never send secrets or private data to outside tools. Logs carry ids, error names and codes; never passwords, tokens, personal data, whole request bodies, or raw error messages, which can echo the user's input.
5. **Never weaken a safety check to make something work** (SSL verification, CORS, CSRF, file permissions, auth). Fix the cause; see the known-fixes table in `references/security.md`.

**Data**

6. **All-or-nothing, safe to repeat.** Multi-step changes run in one transaction. Shared counters use locks or atomic updates. Side effects run after success. Create, charge and send actions are safe to repeat.
7. **Never delete, drop, empty or overwrite stored data without the user's explicit OK.**
8. **Never break what is shipped.** Public APIs, old app versions, saved data, file formats, URLs and flags keep working. Change by adding; deprecate before removing. A risky behaviour change ships with a way back (a switch that turns it off, or a tested revert).

**Honesty**

9. **Prove it, don't claim it.** Never say done or fixed without running something that shows it. If you could not run it, say so and give the user the steps.
10. **Never weaken a test to make it pass.** If the test itself is wrong, say why before changing it.
11. **Never invent** function names, API fields, config keys, file paths, command flags or package names. Check that they exist, and check a library's API against the version the project installs, not against memory (see Build).
12. **Fix the cause, not the symptom.** No swallowed errors, no special case for the test's input, no hard-coded answers.

**Actions**

13. **Confirm before anything irreversible or touching production:** deleting files, force-pushing, deploying, sending emails or messages, payments, publishing, stress tests outside local or staging. Skip the question only if the user already clearly said to go ahead.

**Work**

14. **Understand before you change anything, at every size.** Read the code you will touch, what calls it, and how the project already solves this kind of problem. Search for what already does the job, and build on it. Do not write a line until you can say what exists, what you will change, and where the change belongs. Code that repeats or goes around what the project already has is a bug, even when it works: nobody can reuse it, and the next fix has to be made twice.
15. **No code before a checklist the user can see** (small, normal and complex tasks; a trivial task needs none). It goes in your agent's task list, and you tick each item as you finish it. How to write it: Design, below.

## The five moments

### 1. Understand

The most important moment, at every size (MUST 14): what you learn here decides the quality of everything after it. Scale it to the task, never skip it.

- Read the project's own rules first (see "Who wins").
- Read the code you will touch: its callers, its tests, the patterns around it.
- Search for something that already does the job: a helper, a component, a query, a constant. Search by what it does, not only by the name you would give it. Extend it before inventing anything new.
- State your assumptions. If the request is unclear, or a simpler or safer way exists, say so before building (see "Asking questions").

**Check:** I know what already exists and what the user actually needs.

### 2. Design

- **Write the checklist before any code** (small, normal and complex tasks). It splits the task into items, in the order you will do them, and you work through it one item at a time while the user watches.
  - **It goes in your agent's task list.** In Claude Code: `TaskCreate`, one task per item, all created before your first edit (if the tool is not loaded yet, load it first with ToolSearch `select:TaskCreate,TaskUpdate`). Set an item `in_progress` when you start it, and `completed` as soon as it is built and its check ran: one at a time, never all at the end.
  - **Only when your agent has no task list**, write it as a numbered list in your reply, before your first edit. A checklist kept in your thinking does not count: nobody can see it.

  A few words per item:
  1. **The first item is what you build on**: the existing piece you reuse, extend or mirror, with its file path, or `New: nothing like it exists` once you have searched.
  2. **Every ask in the request is an item**, including asks hidden in a sentence after a list.
  3. **Then go through these questions and add an item for each one that needs work.** Skip a question with nothing to do; never write "n/a".
     - **Edges**: inputs that break naive code: empty, zero, negative, huge, duplicate, uneven split.
     - **Twice**: what happens if it runs twice: double click, retry, two users at once.
     - **Data**: what is read and written; does it need one transaction?
     - **Load**: how often it runs, how much data; any query or call inside a loop?
     - **MUSTs**: each MUST above that applies, as the thing to do (`MUST 2: only the invoice's owner may read it`).
     - **Risks** (complex tasks): races, permissions, data loss, the way back.
  4. **The last items are the proof**: the checks that show it works; for a bug, first the test that fails today. When users can see or use the change, one proof item is the real-user test, naming the tool (`Proof: try it in Claude in Chrome`).

  ```
  1. Build on active_products() in catalog/queries.py: it already filters deleted ones
  2. Hide deleted products from search
  3. Edge: every match deleted → an empty list, not an error
  4. MUST 1: the query stays parameterized
  5. Proof: a test that search("lamp") skips a deleted lamp fails today, passes after
  6. Proof: the full suite passes
  ```

  **Small tasks** list only what you build on, the asks, their edge cases and the check.

  An item that names a risk ends as code, a test, or a `Warning:` line in the report. Code that contradicts an item is a bug. Before the report, read the request again against the list: every item is completed, or it is reported as not done. Two full worked examples: `references/examples.md`.
- Choose the simplest thing that works. Build only what was asked: no options, flags or hooks "for later" (the off-switch MUST 8 asks for is not "for later").
- An endpoint anyone can call that logs in, sends email or SMS, or costs money ships with a rate limit in the code (per IP, and per account or address), using the project's limiter if it has one, or else a small counter with an expiry in its cache or database. A `Warning:` line instead of the limit is not enough.
- One job per piece. Simple interfaces that hide the details. Each decision (how we search, price, authenticate) lives in one place.
- Business rules live outside handlers, views and UI components; those edges only parse, call the rule, and respond. Rules that need the database count too:

  ```
  ❌ handler: BEGIN → SELECT … → check the rule → INSERT … → COMMIT → respond
  ✅ handler: input = parse(request) → result = transfer(db, user.id, input) → respond(result)
     transfer(db, userId, input): every rule, its queries and the transaction; no request object
  ```
- A status is a state machine: one table of allowed moves, one function that moves it. Errors follow one model: expected ones typed and mapped to responses in one place, unexpected ones fail loudly (`references/design.md`, `references/correctness.md`).
- Place code where its kind already lives: find the closest existing example (a model, an endpoint, a screen) and mirror its folder nesting, file split, naming and wiring. Only when the project has no pattern: feature first, then kind inside.
- Shape the data: parse input once at the edge, make bad states impossible, snapshot historical facts (the price paid, not today's price). Money is integer cents or decimals, and when an amount is split, the parts add up exactly to the whole: give the leftover cents to some shares by a clear rule, never round every share the same way.
- For multi-step work, start with a thin slice that works end to end, then add to it one checklist item at a time.
- Open the reference files the routing table points to.

**Check:** the checklist is written, and this is the smallest design that works.

### 3. Build

- Work in small steps and run each one before the next.
- Before calling a library or framework API, check it against the version the project uses, in this order: (1) the version in the lock or manifest file, (2) the installed package's own types, docs or source (`node_modules`, `.venv`, `vendor` are usually git-ignored, so file search skips them: open or list the path directly), (3) the official docs for that exact version, (4) still unsure → a tiny script that calls it and runs. Memory of an API is often an older version.
- Follow the house style, but never copy or extend a danger (string-built SQL, weak hashing, a query inside a loop, a race): write it safely and point it out. Where the structure is messy, don't make it worse: new code goes into new small pieces.
- A performance, security or correctness problem **inside the code you are changing** gets fixed in this change; a change that extends a known problem is not done. Keep the fix behaviour-preserving and say what you changed.
- Give every new file, class and function a header saying what it does and why, in the language's doc format; one line is enough when it is obvious. Explain the *why* of complex code. Never narrate obvious lines. Don't add headers or comments to existing code you are not otherwise changing. No commented-out code, no silent TODOs.
- Clean only the area you touch; list problems in code you are *not* changing in the report. When a task needs both restructuring and a behaviour change, do them as two separate steps, one after the other.
- A hand-written file over ~400 lines or a function over ~50 is a signal: check it is not doing more than one job.
- When stuck: if the same fix fails twice, stop and look for the real cause. After a third failure, explain what you tried and ask.

**Check:** each step works before the next one starts.

### 4. Verify

- Run every check the project already has: build, type checker, linter, formatter, tests.
- Run `scripts/check-diff.sh` from this skill's folder inside the project (needs bash and git; `--files <paths>` works without git). It flags known dangers in the lines you added, and safety checks you removed without adding back (access checks, raised errors, validation). Run it, don't read it, and re-run it until it reports nothing. Fix each finding, or mark a false alarm on that line with a comment containing `check-diff: ok <reason>`; for a check you removed on purpose, say why in a comment containing `check-diff: ok removed-guard <reason>` in that file. As a Claude Code plugin it also runs after every file edit.
- Add tests by risk: **always** for bug fixes (reproduce the bug with a failing test first) and real logic (money, rules, permissions, calculations); **never** for trivial changes; suggest them for everything else. If you cannot run tests, still write them into the change (or the reply when there are no files) and mark them not run.
- **When users can see or use the change:** finish with a real-user test: use it the way a person would, through the real interface, on a safe environment, never production. A passing test suite (pytest, jest) is not a real-user test. Use a tool you are connected to before writing your own, and look for one first (in Claude Code: ToolSearch for `chrome`, `browser`, `simulator`, and the skills list): (1) a connected browser or app tool (Claude in Chrome, the built-in browser, a Playwright or other browser tool, a simulator or emulator tool, computer use); (2) only without one, a script of your own that drives a real browser or the real app; (3) for an API or a command-line tool, real HTTP calls or the terminal. If nothing can reach the interface, say so, give the user the steps to try by hand, and do not claim high confidence. Look at the result and compare it with what was asked (layout, order, alignment), not only that it runs. Try the happy path, then act like a careless human (see the checklist in `references/testing.md`). Compare results with expected values worked out separately. When the app has more than one language, repeat it in the other language, and right to left if supported. Every bug found becomes a test, then gets fixed and retested.
- **When the software has users or clients and the change touches data paths:** test with a large dataset and send 10–20 requests at the same item at once, locally or on staging (no confirmation needed there). Hot paths and releases get a real stress test on staging (`references/performance.md`).
- Review your own diff with `references/review.md`. **Complex tasks** also get an independent review: a separate reviewer (a subagent, if your agent has them) receives the diff and the touched files with a narrow job such as "find bugs in this change". Without subagents, do a second, separate pass with the checklist. Fix what is found and re-run the checks.

**Check:** I *showed* it works, including the human mistakes.

### 5. Report

End every normal or complex task with this, in Markdown, outside any code block. Trivial tasks skip it: the change plus at most one short sentence. Small tasks end with only the Confidence line below, and nothing after it; when something was not run, the same line says so and gives the command to run it (``**Confidence: Low 🔴** tests written, not run: `pytest test_duration.py` ``).

````markdown
---
### 1. What was done
```diff
+ the result in one line of plain words
```
- `path/file`: what it does now
- Checks: ✅ build · ✅ tests 42/42 · ❌ lint (under a ❌, a short code block with the real output)
- Undo: the switch or revert (risky changes only)

**Confidence: Medium 🟡** the one reason, in plain words

---
### 2. Needs attention
**This task**
```diff
- what failed or was not verified + the steps for the user to check it
- Warning: an overridden MUST, a weakened check, a risk left open
```
- Not committed: 2 files on branch `fix/x`

**Found elsewhere, not touched**
```diff
- `path/file`: a serious problem
```
- `path/file`: a minor problem

---
### 3. Waiting for you
1. a question the work depends on
---
````

- **Part 1, always.** When the task is about speed or request counts, add the numbers as a `diff`: `- before`, `+ after`. If you stopped to ask before changing anything, say so in one line.
- **Confidence comes from the evidence, never a percentage.** **High 🟢**: every check ran and passed, and the real user path was tried. **Medium 🟡**: the checks pass, but something in part 2 was not verified. **Low 🔴**: tests could not run, a check failed, or you had to guess about the code or the request. A ❌, a `Warning:` line, or any check listed as not run rules out High. In the three-part report, each check not run also goes under Needs attention as a red line.
- **Part 2, always.** Leave out an empty group, and an empty `diff` block; if nothing is left, write `Nothing needs attention.` Red lines (`-` in a `diff` block) only for what can hurt users or data now: a failing or unverified check, a security hole, data loss, wrong money. Everything else is a plain bullet. A serious problem found elsewhere is still red; report it, don't fix it. The git line appears only when something is not committed, not pushed or on the wrong branch.
- **Part 3, only when you need an answer.** Numbered, so the user can reply "1: yes". Follow "Asking questions".
- About 10 lines for a normal task, one line per item. Emoji only for status: ✅ ❌ on checks, one dot on confidence, none in headings. No summary before the report (the report is the summary), no restating the task, no generic advice, no risks unrelated to this change. Complex tasks may run longer, never padded. No "should work now".

**Check:** someone could trust this without re-checking it.

## Routing: which reference to read

| When the task… | Read |
|---|---|
| Is normal or complex, before your first checklist | `references/examples.md` |
| Creates a feature, module or abstraction | `references/design.md` |
| Creates files or folders, names things, or writes comments | `references/structure.md` |
| Handles input, stored data, money or time | `references/correctness.md` |
| Touches auth, permissions, secrets, files, uploads or dependencies | `references/security.md` |
| Writes or changes tests, or finishes any normal or complex task | `references/testing.md` |
| Changes existing code, an API or a database schema | `references/existing-code.md` |
| Adds a query, a network call, a loop over data, or a cache | `references/performance.md` |
| Calls anything outside the process, or has a UI | `references/resilience.md` |
| Calls an AI model (chat, completion, agents, tools) | `references/ai-features.md` |
| Changes what people see or touch in a UI | `references/ui.md` |
| Reaches Verify or Report | `references/review.md` |

## Asking questions

Every question to the user, on any topic, must work for a junior as well as a senior:

1. Plain words; explain any term the user may not know.
2. What each option leads to.
3. One option marked **recommended**.
4. "If you're unsure, choose the recommended one."

Ask only when the answer changes what you do. Otherwise pick the safe default, say which one you picked, and continue.
