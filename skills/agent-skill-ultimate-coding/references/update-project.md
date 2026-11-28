# Change requests on an existing project

How to take on a large feature or update in a project that already exists, or to finish one that is half-built: learn the project, show its state, agree the request, then build it in phases. Read this when the user asks for such a change. A small fix or a one-place change takes the skill's normal path instead.

**Contents**
- 1 Learn the project before any code
- 2 Show the state and ask
- 3 Record the change request
- 4 A pointer in CLAUDE.md while work is active
- 5 Build it in phases

---

### 1. Learn the project before any code

Even when part of the work looks clear, the user may know things the code does not. A project that is "almost done" often has a reason why the rest is not.

1. **Read what the project says about itself:** `CLAUDE.md`, `docs/project.md` and any active sprint or change-request file, the README, and the recent version-control history.
2. **Run the tests and the build** to see what works today. A failing test is part of the state, not a reason to start fixing.
3. **Read the code the request touches** and its callers (MUST 14), and search for what already does part of the job (`design.md` §1).
4. **Sort what you found:** done, half-built, missing, and open (a choice nobody has made yet, such as a format or a provider).

If neither `CLAUDE.md` nor `docs/project.md` explains the project, write `docs/project.md` now with the sections in `new-project.md` §3, from what you found. Keep it up to date as you learn more.

### 2. Show the state and ask

Before any code, show the user what you found, then ask about what is open, in the skill's ask style (one to three questions, options, your recommendation first):

```text
Works: book an appointment, list a day's appointments (tests 8/8)
Half-built: cancel (the route exists, nothing frees the slot; no test)
Missing: SMS reminders, the weekly report
Open: which SMS provider? Should the report be a PDF or a screen?
```

**Your first reply to a change request is this state and these questions, and nothing else:** no code, even for the parts that look clear, and no report after the questions, so they are the last thing the user reads. Code starts in a later turn, once the user has answered. Keep asking, round by round, until no open choice is left.

### 3. Record the change request

Write the request down in the same turn you ask, so it survives a new session: `docs/change_requests/CR-NNN-<short-name>.md`, numbered after the last one (`CR-001-sms-reminders.md`). Fill in Decisions as the answers come in:

- Request: the user's words
- Current state: from §2
- In scope and Out of scope
- Decisions: the user's answers
- Phases: the thinnest working slice first, tasks ticked only when built and proven
- Done when: the checks that prove it
- Open questions: **must be empty before the code starts**

The file stays under 200 lines (the same limit and reason as `new-project.md` §3).

### 4. A pointer in CLAUDE.md while work is active

The same `## Active work` section as `new-project.md` §4, pointing at the change-request file: plain paths, never `@` imports, and the user's own text there left as it is. Remove it when the request is done.

### 5. Build it in phases

- Each phase works before the next starts. Work through the skill's normal path (checklist, build, verify, report) for each.
- Change existing code by `existing-code.md`: follow the house style, never break what is shipped, keep each change focused.
- Place and wire new files the way their siblings are placed and wired (`structure.md` §1).
- When the request is done, run every check, shrink the request to one to three Status lines in `docs/project.md`, and remove the pointer.

---

### Sources

Checked on 2026-11-27. Re-read the original when a detail matters.
- Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): the agent starts by reading "the git logs and progress files to get up to speed", and runs "a basic end-to-end test before implementing a new feature".
- Claude Code, [Best practices](https://code.claude.com/docs/en/best-practices): interview the user "until you could write the spec", then build from it.
- Claude Code, [Memory](https://code.claude.com/docs/en/memory): `CLAUDE.md` loads in every session; "target under 200 lines".
- IEEE 828 (configuration management): change control (a change request is recorded, decided, then made and tracked); NASA Software Engineering Handbook, [SWE-082 Authorizing changes](https://swehb.nasa.gov/display/SWEHBVB/SWE-082+-+Authorizing+Changes).
