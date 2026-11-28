# New project

How to start a project from nothing: agree what it is, plan it in sprints, then build one sprint at a time. Read this when the user starts an app or project in an empty folder, or asks you to build one from a brief.

**Contents**
- 1 Agree the scope before any code
- 2 Split it into sprints
- 3 Write the plan into the project
- 4 A pointer in CLAUDE.md while work is active
- 5 Build one sprint at a time

---

### 1. Agree the scope before any code

A brief like "an ordering app for my bakery" leaves the real choices open: who uses it, what comes first, where it runs, what is out. An app built on guesses is thrown away.

1. **Say back what you understood** in two or three lines: what it is for, who uses it, the must-haves.
2. **Ask about what is open**, in the skill's ask style: one to three plain questions per round, each with options and your recommendation first. Typical first round: who uses it (and what each kind of user may do), which features come first, where it runs (web, phone, desktop) and the stack.
3. **Keep asking, round by round, until no open choice is left.** Every choice is either answered by the user or written down as an assumption the user approved. A value with a safe default (a page size, a timeout) is not a question: take it and name it.

No code, no scaffolding and no package installs until the scope is agreed. Reading and planning are fine.

### 2. Split it into sprints

Show the split in the same reply as your first questions, so the user can correct it:

- **Sprint 1 is the thinnest slice that works end to end** (input → logic → storage → output), as `design.md` §13 says. Example: staff take an order and see today's orders. Nothing else.
- Each later sprint adds one feature area on top of a working app.
- Anything the user called "later" or "maybe" goes in a "Not now" list, not in a sprint.

```text
Sprint 1: staff take an order for a pickup time; list today's orders
Sprint 2: customers order online and pick a time slot
Sprint 3: online payment
Not now: delivery, loyalty points
```

### 3. Write the plan into the project

Once the user has answered, write the plan into the project's `docs/` folder, so it survives a new session:

**`docs/project.md`**: your understanding of the project, kept up to date.
- Purpose and users
- Stack, and why
- Structure: where code lives (`structure.md` §1–2)
- Decisions the user made, one line each
- Status: one to three lines per finished sprint

**`docs/sprints/sprint_N.md`**: one file per sprint.
- Goal: one sentence
- In scope and Out of scope
- Decisions: the user's answers for this sprint
- Tasks: one line each, ticked only when built and proven
- Done when: the checks that prove it (tests, the real-user test)
- Open questions: **must be empty before the sprint's code starts**

Every docs file stays **under 200 lines** (the length Claude Code's memory docs set for `CLAUDE.md`). Longer files cost context and are followed less well. When one grows, cut it: a finished sprint shrinks to its Status lines in `project.md`.

### 4. A pointer in CLAUDE.md while work is active

`CLAUDE.md` is loaded into every session, so it holds only a short pointer while a sprint is active, at the bottom:

```markdown
## Active work
Current: docs/sprints/sprint_2.md · Project: docs/project.md
```

- Write paths as plain text, **never as `@docs/...` imports**. An import loads the whole file into every session.
- Create `CLAUDE.md` if the project has none: the commands to build and test, then the pointer. Never rewrite what the user wrote there.
- Remove the section when the last sprint is done. `docs/project.md` stays, and the next session finds it there.

### 5. Build one sprint at a time

- Start each sprint from its file. When a sprint's plan is long, offer to build it in a fresh session, which starts with a clean context.
- Lay out code by `structure.md` §1–2, design it by `design.md`, test it by `testing.md`. This file does not repeat them.
- Work through the skill's normal path (checklist, build, verify, report) for each task.
- Tick a task in the sprint file only when it is built and proven.
- At the end of a sprint, run every check, write its Status lines in `project.md`, point the CLAUDE.md section at the next sprint (or remove it), and show the user what works before starting the next.

---

### Sources

Checked on 2026-11-27. Re-read the original when a detail matters.
- Claude Code, [Best practices](https://code.claude.com/docs/en/best-practices): "Interview me until you could write the spec, then write it to SPEC.md", and start "a fresh session to build from it, so the build begins with a clean context".
- Claude Code, [Memory](https://code.claude.com/docs/en/memory): "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence". Imports "don't reduce its context cost, because imported files load together with the CLAUDE.md that imports them".
- Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): structured note-taking, notes "persisted to memory outside of the context window".
- Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): a progress file and a feature list the next session reads first, and work done one feature at a time.
