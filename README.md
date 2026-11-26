<div align="center">

<img src=".claude-plugin/icon.png" alt="agent-skill-ultimate-coding: a pixel-art engineer bot with a hard hat, a shield with a check mark, and a wrench" width="140">

# agent-skill-ultimate-coding

### Senior-engineer discipline for AI coding agents, in any language.

**Small, clear, safe code that is _proven_ before it is called done.**

[![GitHub stars](https://img.shields.io/github/stars/Khodour/agent-skill-ultimate-coding?style=flat-square&logo=github)](https://github.com/Khodour/agent-skill-ultimate-coding/stargazers)
[![Version](https://img.shields.io/badge/dynamic/json?style=flat-square&label=version&color=C96A43&url=https%3A%2F%2Fraw.githubusercontent.com%2FKhodour%2Fagent-skill-ultimate-coding%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-A9502E?style=flat-square)](#install)
[![Evals](https://img.shields.io/badge/evals-with%20vs%20without-2EA44F?style=flat-square)](#proven-with-evals)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Khodour%20Fouani-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kodr-fouani-b75523179/)

**[Install](#install) · [How it works](#how-it-works) · [The MUST rules](#the-must-rules) · [Evals](#proven-with-evals) · [Contributing](#contributing)**

</div>

---

AI coding agents already know the principles of good engineering. What they lack is consistency: they agree with the rules, then skip them under pressure. This skill builds that discipline into every task. The agent reads the project before it changes anything, asks you when a real choice is open, works through a checklist you can watch, tests the result the way a user would, and tells you in plain words how sure it is.

| ❌ Without the skill | ✅ With the skill |
|---|---|
| Reports "fixed" without running anything | Shows proof, or states clearly what was not verified |
| Weakens a test or a security check to make an error disappear | Fixes the root cause |
| Invents functions, API fields or packages | Verifies they exist in the installed version |
| Overlooks double submits, race conditions and retries | Writes safe, repeatable, backward-compatible changes |
| Over-engineers a one-line fix | Matches the effort to the size of the task |
| Starts coding before reading the project, then writes what already exists | Reads first, and builds on what is there |
| Fills in what you left open ("X days") by itself | Asks you, with options and a recommendation |
| Trusts a green test suite | Tries the change as a real user, in a real browser or app |
| Ends with a long summary and "should work now" | Ends short: what works, what is missing, how sure it is and why |

## Proven with evals

Every task in the suite runs **with and without** the skill and is scored by independent graders. **Held-out** tasks were written before any tuning and never used to change the skill, so they show how it does on work it has not seen.

| Model | Tests | Without the skill | With the skill | Measured on |
|---|---|:---:|:---:|:---:|
| Claude Sonnet 5.5 | **Independent held-out, 6 tasks**, written by an agent that never saw the skill | 0.92 | ✅ **1.00** | 2.2.0 |
| Claude Sonnet 5.5 | **Held-out, 13 tasks** (Python, Java, Ruby, TypeScript) | 0.71 | ✅ **0.97** | 2.2.0 |
| Claude Sonnet 5.5 | Full suite, 78 tasks | 0.85 | ✅ **0.98** | 2.2.0 |
| Claude Haiku 5.5 | Full suite | 0.82 | ✅ **0.96** | 1.6.0 |
| Claude Opus 5.5 | 10 hardest tests | 0.68 | ✅ **0.97** | 1.6.0 |

The Sonnet rows run every task 5 times, judged by Claude Opus 5.5. The skill scores a perfect result on 73 of the 78 tasks and clearly raises the score on 15. Three tasks scored a little lower with it; each is explained in [evals/RESULTS.md](evals/RESULTS.md), with the score of every task.

**What it costs:** with the skill, an agent took 8.8 turns per task on average against 4.1 without, and about 1.5× the spend. The extra turns are the work itself: reading the project first, writing tests, the checklist and the checks.

<p align="center">
  <img src="docs/assets/eval-results.svg" alt="Behaviours the skill takes to a 100% pass rate, per model. Claude Haiku 5.5: query inside a loop 0% to 100%; gift card 0% to 100%; double submits 0% to 100%; AI refunds need a human 33% to 100%; rule out of the route 33% to 100%; parameterized queries 67% to 100%. Claude Sonnet 5.5: database rules out of the web layer, gift card, coupon, bill split and reproducing test each 0% to 100%; double submits, failed cart read and AI summary 33% to 100%; AI refunds 67% to 100%. Claude Opus 5.5, 10 hardest tests: database rules 0% to 100%; gift card 0% to 100%; double submits 33% to 100%." width="100%">
</p>

The chart shows the behaviours the skill takes to 100%, measured on version 1.6.0. Partial gains and the two small regressions of that version are in the table below. On the remaining tasks, both versions perform well, and small fixes stay small. [Run the evals yourself](#evals).

<details>
<summary>The numbers behind the chart (version 1.6.0)</summary>

Passing runs, without → with the skill. ✅ marks a behaviour that passed every run.

| Behaviour | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|:---:|:---:|:---:|
| Editing code with a query inside a loop fixes it | 0/3 → ✅ 3/3 | passed before | not run |
| Database rules are kept out of the web layer | 0/5 → 1/5 | 0/3 → ✅ 3/3 | 0/3 → ✅ 3/3 |
| A gift card's rules are kept apart and its balance is safe under races | 0/5 → ✅ 5/5 | 0/3 → ✅ 3/3 | 0/3 → ✅ 3/3 |
| A coupon's rules are kept apart and it is used once per customer | 0/5 → 1/5 | 0/3 → ✅ 3/3 | 0/3 → 2/3 |
| Order code is safe against double submits | 0/3 → ✅ 3/3 | 1/3 → ✅ 3/3 | 1/3 → ✅ 3/3 |
| A bill split adds up exactly to the total | 0/3 → 2/3 | 0/3 → ✅ 3/3 | passed before |
| A bug fix comes with a test that reproduces the bug | passed before | 0/3 → ✅ 3/3 | passed before |
| A bug fix finds the root cause | 0/3 → 2/3 | passed before | not run |
| A business rule is kept out of the route | 1/3 → ✅ 3/3 | passed before | not run |
| Queries built from user input stay parameterized | 2/3 → ✅ 3/3 | passed before | not run |
| Debug logs never write raw errors or request bodies | 0/5 → ✅ 5/5 | not run | not run |
| A public endpoint that sends paid email gets a rate limit in the code | 0/5 → ✅ 5/5 | not run | not run |
| A failed cart read never wipes the saved cart | 2/3 → 2/3 | 1/3 → ✅ 3/3 | passed before |
| An AI support bot needs a human to approve refunds | 1/3 → ✅ 3/3 | 2/3 → ✅ 3/3 | passed before |
| An AI summary is cached and survives a failed call | passed before | 1/3 → ✅ 3/3 | not run |
| A typo fix gets a short reply | passed before | 3/3 → 2/3 | passed before |
| A small change gets a short report | 3/3 → 0/3 | passed before | not run |

The last two rows are the only places where version 1.6.0 scored lower: on small tasks its reply could run a little long. Version 2.0.0 has a short report, and the small-task case now passes with the skill and fails without it.

</details>

## How it works

<p align="center">
  <img src="docs/assets/how-it-works.svg" alt="Six steps: 0 Size the task, 1 Understand, 2 Design, 3 Build, 4 Verify, 5 Report. Each step ends with a check." width="100%">
</p>

| Size | Examples | What runs |
|---|---|---|
| 🟢 **Trivial** | Typo, text change, rename, one config value | The change and the project's checks |
| 🔵 **Small** | One self-contained function: a formatter, a parser, a pure calculation | A short checklist, tests by risk, a short report |
| 🟡 **Normal** | One self-contained change: a feature, a bug fix, a new screen or endpoint | A full checklist before code, tests by risk, a real-user test, a short report |
| 🔴 **Complex** | Work that splits into several changes: a feature across modules, a migration with its code | One checklist per part, each part working before the next |

**Risk areas, at any size:** a change that touches auth, personal data, money, concurrency, a migration or a public API gets that area's checks and a separate reviewer, as Google's code review guide asks. Size is how much work there is; risk is what it touches.

Every size starts the same way: the agent reads the code it will touch and looks for what already does the job.

- **Understand first.** The first item on its checklist names what it builds on, so new code extends the project instead of repeating it.
- **Asks when it matters.** A choice you left open gets one to three questions, each with options and a recommendation, before any code; so does anything confusing it finds while working. Small details with a safe default are not asked about.
- **A checklist you can watch.** The plan stays on screen above the input and is ticked one item at a time. It covers what the agent builds on, your asks, the edge cases, the risks and the proof.
- **Tests like a user.** When people can see or use the change, the agent tries it through a connected tool: a browser extension, a built-in browser, a simulator. A passing test suite alone does not count.
- **A short, honest report.** `All done!` only when everything passed. Otherwise what works, what is missing in red, then "I have high / medium / low confidence in this change, because…" and numbered options to raise it.
- **Lightweight.** The core stays short; detailed guidance loads only when a task needs it.
- **Automated checks.** A built-in checker scans every edit for common dangers, such as unsafe SQL, disabled security checks, hard-coded secrets and swallowed errors.
- **Respects your project.** Your instructions and your project's own rules always come first.
- **Measured overhead.** The core skill is about 6,500 tokens. A task adds only the topic files it needs, about 1,000–2,000 tokens each (security for an auth change, testing for new tests).

## The MUST rules

Applied to every task, whatever its size. Only you can override one, and the agent will flag it in its report. The two work rules, understand first and checklist first, are on by default; a team can also turn them off in its own project rules (`CLAUDE.md` or `AGENTS.md`).

- 🔒 **Security:** data never becomes code · check access for every action **and every record** · never hand-roll auth or crypto · secrets stay out of code, git, logs and apps, and logs never hold personal data or raw errors · never weaken a safety check
- 💾 **Data:** all-or-nothing writes, safe to repeat · never delete or overwrite data without an explicit OK · never break what is shipped
- 🧾 **Honesty:** prove it, don't claim it · never weaken a test · never invent names, APIs or packages · fix the cause, not the symptom
- ⚠️ **Actions:** confirm before anything irreversible or touching production, and never read production data without your OK
- 🧭 **Work:** understand before you change anything, at every size · no code before a checklist you can see

## Install

**Claude Code (plugin):**

```
/plugin marketplace add Khodour/agent-skill-ultimate-coding
/plugin install agent-skill-ultimate-coding@agent-skill-ultimate-coding
```

**The checklist.** In Claude Code the plugin draws the agent's checklist above the input while it works: a coloured meter, each item ticked as it is done, the item being worked on highlighted. Nothing to set up. You can turn it off any time in `/config` › *Checklist above the input*, but we recommend keeping it on. Without the plugin, the agent uses its own task list if it has one, or a numbered list in its reply.

**Other agents:** copy the `skills/agent-skill-ultimate-coding/` folder into your agent's skills folder (for example `~/.agents/skills/` for Codex, Cursor, Gemini CLI and Copilot). Tested on Claude Code; feedback from other agents is welcome.

### Make it always on (recommended)

The plugin loads the skill automatically. If you installed it manually, add this line to your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For every coding task, load the agent-skill-ultimate-coding skill first and follow it. Any task that adds or changes logic starts with its checklist, before any code.
```

## Evals

```bash
CLAUDE_CODE_ENABLE_TODO_TOOLS=1 claude plugin eval . --scaffold --no-publish --judge-model sonnet --max-cost-usd 10
```

Each case runs with and without the skill and reports the difference. The switch at the start gives the runs the task list. Some cases build a sample project, which is what `--scaffold` allows; review their `scaffold.sh` before running them. Some cases also need tools granted with `--allow-tools` (for example `Edit Write TaskCreate TaskUpdate ToolSearch`).

## Contributing

Issues and pull requests are welcome. A new rule should work in any language, prevent a real failure, and measurably change what the agent does.

## About the author

Built by **[Khodour](https://www.linkedin.com/in/kodr-fouani-b75523179/)**, an Anthropic-certified AI architect and senior software engineer with more than 25 years of experience shipping production software with large teams.

## In Claude Code

Extra help on screen, each one switchable in `/config`: check-diff results under each edit, a `/uc-score` session scorecard, and a report check that asks Claude once to end a coding task with its report and confidence (skipped when your project's `CLAUDE.md` or `AGENTS.md` sets its own format, or when you ask for a different reply). The plugin never blocks an edit and never decides how big a task is: the agent does. The report check costs tokens only when it steps in.

## License

[MIT](LICENSE). Free to use, modify and share, including for commercial use.
