# Documentation: READMEs, guides, API docs and decision records

How to write the documents people read to use, run and change the code. Read this when a task writes or changes a README, a guide, API docs, a runbook or a decision record, or changes behaviour that a document describes.

**These are lasting principles, not copies of the standards.** The truth is, in this order: how the project already documents (its doc folder, its templates, its style guide, its doc tool), then the official guides of those tools as they are today. Follow the project's shape; use this file where it has none.

This file adds to rules that already exist: docs change in the same change as the behaviour (`existing-code.md`, rule 8) and comments in code (`structure.md`, rules 6–8).

**Contents**
- 1 Docs follow the change
- 2 One page, one job
- 3 Write for the reader in a hurry
- 4 Examples that run
- 5 Decision records, for decisions that are hard to undo
- Sources

---

### 1. Docs follow the change

When a change alters how something is installed, configured, called or run, find every document that describes it (search for the old name, flag, endpoint or command) and update it in the same change. A new setting, environment variable, command or endpoint is documented where its neighbours are. A removed one is removed from the docs too.

### 2. One page, one job

Readers come with one of four needs, and a page that mixes them serves none well:
- **Tutorial:** learning by doing, for a newcomer. One path, no choices, it always works.
- **How-to guide:** reaching a goal, for someone who already knows the basics. Steps, with the conditions that change them.
- **Reference:** looking something up: every option, field, flag or endpoint, complete and dry.
- **Explanation:** understanding why: background, design, trade-offs.

Put new text on the page that matches its job, and link to the others instead of mixing them in. A long explanation in the middle of setup steps belongs on its own page.

### 3. Write for the reader in a hurry

- Address the reader as "you", in active voice: "Run `make test`", not "Tests can be run".
- **Conditions before instructions:** "If you use Docker, run …", not "Run … if you use Docker".
- The most important thing first: what it is and how to start, before history and details.
- Code, commands, file names and values in code format. Dates in an unambiguous format.
- Short sentences, plain words; explain a term the first time it appears.
- Don't announce what is coming ("soon", "in a future version"); document what exists.

### 4. Examples that run

Every command and code example in a document is one you ran, or copied from code that runs, with the real names and flags of the current version (MUST 11). Placeholders are obvious (`<your-token>`), never values that look real. An example that fails is worse than none.

### 5. Decision records, for decisions that are hard to undo

**When the project keeps decision records** (often `docs/adr/` or `docs/decisions/`), or the user asks for one: a decision that is expensive to reverse (a new database, framework or service, a public API shape, a security model) gets a short record in the project's template, or with these parts:
- **Title** and **status** (proposed, accepted, replaced by …).
- **Context:** the problem and the forces at play.
- **Decision:** what was chosen, and the options that were not, with why.
- **Consequences:** what becomes easier, what becomes harder, what is now owed.

A record is never rewritten when the decision changes; a new one replaces it and says so.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- [Diátaxis](https://diataxis.fr/)
- [Google developer documentation style guide: highlights](https://developers.google.com/style/highlights)
- Architecture decision records: [adr.github.io](https://adr.github.io/), [templates](https://adr.github.io/adr-templates/)
- Google Engineering Practices: [change descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
