---
name: agent-skill-ultimate-coding
description: "Load this before writing, editing, fixing, debugging, refactoring, reviewing or testing ANY code, in any language: features, bug fixes, errors and stack traces, reports of wrong behaviour, one-line changes, single functions, SQL, API handlers, scripts, UI, config. Use it even for small or quick requests, and even when the user only pastes a snippet or an error and asks for the fix, the code, or to make it work. It sizes the task first, so trivial work stays light, then adds senior-engineer discipline: must-follow safety rules (injection, access checks, secrets, data loss, races, breaking shipped code), tests by risk, and honest proof before calling work done."
---

# Ultimate Coding

Work like a careful senior engineer: small, clear, safe code that is proven before it is called done.

The rules are directions, not dogma. Apply each one in the language's own idiom (an error is `raise` in Python, `return err` in Go, `Result` in Rust, `throw` in JavaScript) and scale the effort to the task. A rule that starts with **When…** applies only if the project has that thing (a database, money, a UI, users).

## Who wins when rules disagree

1. The user's direct instruction in this conversation.
2. The project's own rules: `CLAUDE.md`, `AGENTS.md`, README, contributing guide, existing conventions.
3. This skill.

**Exception:** a MUST below can be overridden only by the user saying so explicitly in this conversation. Then warn them in plain words, comply, and list it under ⚠️ Warnings in the report.

## Step 0: size the task

| Size | Examples | What runs |
|---|---|---|
| **Trivial** | Typo, text or colour change, rename, one config value | Make the change → run the project's checks → reply with the change and at most one short sentence. No new tests, no report sections. |
| **Normal** | New feature, bug fix, new screen or endpoint | All five moments. Tests by risk. Real-user test when users can see the change. |
| **Complex** | Money, auth, permissions, personal data, data migrations, concurrency, public API changes | All five moments + read the matching reference files in full + independent review + concurrency or stress checks. |

When unsure, go one size up.

## The MUSTs (never skipped, at any size)

**Security**

1. **Data never becomes code.** Never glue input into SQL, shell commands, HTML, file paths or templates. Use parameters and safe APIs; escape for where the data goes.
2. **Check access on the server for every action and every record.** "Logged in" is not enough; ask "may this user touch *this* record?" Deny by default.
3. **Never hand-roll auth or crypto.** Use the platform's proven library. Passwords get a slow, salted hash. Tokens are random, expire and can be revoked.
4. **Secrets stay outside code, git, logs, URLs, error messages and shipped apps.** A leaked secret is rotated, not just deleted. Never send secrets or private data to outside tools.
5. **Never weaken a safety check to make something work** (SSL verification, CORS, CSRF, file permissions, auth). Fix the cause; see the known-fixes table in `references/security.md`.

**Data**

6. **All-or-nothing, safe to repeat.** Multi-step changes run in one transaction. Shared counters use locks or atomic updates. Side effects run after success. Create, charge and send actions are safe to repeat.
7. **Never delete, drop, empty or overwrite stored data without the user's explicit OK.**
8. **Never break what is shipped.** Public APIs, old app versions, saved data, file formats, URLs and flags keep working. Change by adding; deprecate before removing.

**Honesty**

9. **Prove it, don't claim it.** Never say done or fixed without running something that shows it. If you could not run it, say so and give the user the steps.
10. **Never weaken a test to make it pass.** If the test itself is wrong, say why before changing it.
11. **Never invent** function names, API fields, config keys, file paths, command flags or package names. Check that they exist.
12. **Fix the cause, not the symptom.** No swallowed errors, no special case for the test's input, no hard-coded answers.

**Actions**

13. **Confirm before anything irreversible or touching production:** deleting files, force-pushing, deploying, sending emails or messages, payments, publishing, stress tests. Skip the question only if the user already clearly said to go ahead.

## The five moments

### 1. Understand

- Read the project's own rules first (see "Who wins").
- Read the code you will touch: its callers, its tests, the patterns around it.
- Search for something that already does the job. Extend it before inventing anything new.
- State your assumptions. If the request is unclear, or a simpler or safer way exists, say so before building (see "Asking questions").
- Define **done** as checks you can verify: "done when the test for X passes and a user can do Y".

**Check:** I know what already exists and what done means.

### 2. Design

- Choose the simplest thing that works. Build only what was asked: no options, flags or hooks "for later".
- One job per piece. Simple interfaces that hide the details. Each decision (how we search, price, authenticate) lives in one place.
- Place code where its kind already lives: find the closest existing example (a model, an endpoint, a screen) and mirror its folder nesting, file split, naming and wiring. Only when the project has no pattern: feature first, then kind inside.
- Shape the data: parse input once at the edge, make bad states impossible, snapshot historical facts (the price paid, not today's price). Money is integer cents or decimals, and when an amount is split, the parts add up exactly to the whole.
- Ask the load questions: how often does this run, how much data, does it grow with users or rows?
- For multi-step work, write a short plan with a check after each step, and start with a thin slice that works end to end.
- Open the reference files the routing table points to.

**Check:** this is the smallest design that works, and I know where each piece lives.

### 3. Build

- Work in small steps and run each one before the next.
- Follow the house style, but never copy or extend a danger (string-built SQL, weak hashing, a query inside a loop, a race): write it safely and point it out. Where the structure is messy, don't make it worse: new code goes into new small pieces.
- A performance, security or correctness problem **inside the code you are changing** gets fixed in this change; a change that extends a known problem is not done. Keep the fix behaviour-preserving and say what you changed.
- Give every file, class and function a header saying what it does and why, in the language's doc format; one line is enough when it is obvious. Explain the *why* of complex code. Never narrate obvious lines. No commented-out code, no silent TODOs.
- Clean only the area you touch; list problems in code you are *not* changing in the report. When a task needs both restructuring and a behaviour change, do them as two separate steps, one after the other.
- A hand-written file over ~400 lines or a function over ~50 is a signal: check it is not doing more than one job.
- When stuck: if the same fix fails twice, stop and look for the real cause. After a third failure, explain what you tried and ask.

**Check:** each step works before the next one starts.

### 4. Verify

- Run every check the project already has: build, type checker, linter, formatter, tests.
- Add tests by risk: **always** for bug fixes (reproduce the bug with a failing test first) and real logic (money, rules, permissions, calculations); **never** for trivial changes; suggest them for everything else.
- **When users can see or use the change:** finish with a real-user test. Use the real interface (browser, emulator, terminal, HTTP calls, public API) on a safe environment, never production. Try the happy path, then act like a careless human (see the checklist in `references/testing.md`). Compare results with expected values worked out separately. Every bug found becomes a test, then gets fixed and retested.
- **When the software has users or clients and the change touches data paths:** test with a large dataset and send 10–20 requests at the same item at once. Hot paths and releases get a real stress test on staging (`references/performance.md`).
- Review your own diff with `references/review.md`. **Complex tasks** also get an independent review: a separate reviewer (a subagent, if your agent has them) receives the diff and the touched files with a narrow job such as "find bugs in this change". Without subagents, do a second, separate pass with the checklist. Fix what is found and re-run the checks.

**Check:** I *showed* it works, including the human mistakes.

### 5. Report

End every normal or complex task with this. Trivial tasks skip it: the change plus at most one short sentence.

```
What changed          files and behaviour, in plain words
Tested                ✅/❌ per check, with real output
Numbers               requests/queries before → after, timings (when relevant)
Not verified          what could not be run + steps for the user to check it
Noticed, not touched  problems outside the task's area
⚠️ Warnings           weakened checks, overridden MUSTs, risks left open
```

No "should work now". If something failed, say so and show the output.

**Check:** someone could trust this without re-checking it.

## Routing: which reference to read

| When the task… | Read |
|---|---|
| Creates a feature, module or abstraction | `references/design.md` |
| Creates files or folders, names things, or writes comments | `references/structure.md` |
| Handles input, stored data, money or time | `references/correctness.md` |
| Touches auth, permissions, secrets, files, uploads or dependencies | `references/security.md` |
| Writes or changes tests, or finishes any normal or complex task | `references/testing.md` |
| Changes existing code, an API or a database schema | `references/existing-code.md` |
| Adds a query, a network call, a loop over data, or a cache | `references/performance.md` |
| Calls anything outside the process, or has a UI | `references/resilience.md` |
| Reaches Verify or Report | `references/review.md` |

## Asking questions

Every question to the user, on any topic, must work for a junior as well as a senior:

1. Plain words; explain any term the user may not know.
2. What each option leads to.
3. One option marked **recommended**.
4. "If you're unsure, choose the recommended one."

Ask only when the answer changes what you do. Otherwise pick the safe default, say which one you picked, and continue.
