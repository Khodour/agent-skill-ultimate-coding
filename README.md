<div align="center">

<img src=".claude-plugin/icon.png" alt="agent-skill-ultimate-coding: a pixel-art engineer bot with a hard hat, a shield with a check mark, and a wrench" width="140">

# agent-skill-ultimate-coding

### Senior-engineer discipline for AI coding agents, in any language.

**Small, clear, safe code that is _proven_ before it is called done.**

[![GitHub stars](https://img.shields.io/github/stars/Khodour/agent-skill-ultimate-coding?style=flat-square&logo=github)](https://github.com/Khodour/agent-skill-ultimate-coding/stargazers)
[![Version](https://img.shields.io/badge/dynamic/json?style=flat-square&label=version&color=C96A43&url=https%3A%2F%2Fraw.githubusercontent.com%2FKhodour%2Fagent-skill-ultimate-coding%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent%20Skill-SKILL.md-C96A43?style=flat-square)](https://agentskills.io)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-A9502E?style=flat-square)](#claude-code-plugin)
[![Works with](https://img.shields.io/badge/works%20with-Claude%20Code%20%7C%20Codex%20%7C%20Cursor%20%7C%20Gemini%20%7C%20Copilot-4493F8?style=flat-square)](#any-agent-copy-the-folder)
[![Evals](https://img.shields.io/badge/evals-with%20vs%20without-2EA44F?style=flat-square)](#proven-with-evals)
[![Last commit](https://img.shields.io/github/last-commit/Khodour/agent-skill-ultimate-coding?style=flat-square)](https://github.com/Khodour/agent-skill-ultimate-coding/commits/main)
**[Install](#install) · [How it works](#how-it-works) · [The MUST rules](#the-must-rules) · [Evals](#proven-with-evals) · [Contributing](#contributing)**

</div>

---

> [!TIP]
> **Installed as a Claude Code plugin, it loads itself on every coding task.** Installed another way, or using another agent? Add the one line from [Make it always on](#make-it-always-on-recommended) to your project's `CLAUDE.md` or `AGENTS.md`.

## Why this skill

Today's models already know SOLID, DRY and SQL injection. What they lack is **discipline**. This skill ties the classic principles to **the moments of a real task** and adds what generic lists skip: task sizing, production reality, and proof.

| ❌ The agent habit | ✅ What the skill makes it do |
|---|---|
| Says "fixed ✅" without running anything | **Proves it**: runs something that shows it works, or says plainly what wasn't verified |
| Turns a red test green by weakening it | **Never weakens a test**; a wrong test is explained before it changes |
| Switches off SSL, CORS or CSRF to make an error go away | **Fixes the cause**, using a table of known safe fixes |
| Invents function names, API fields, even packages | **Checks every name exists** before using it |
| Ignores double clicks, races, offline users, old app versions | Transactions, **safe-to-repeat** actions, timeouts, backward compatibility |
| Over-builds a one-word fix | **Sizes the task first**, so trivial work stays light |

## Proven with evals

Real tasks, run **with and without** the plugin using Claude Code's `plugin eval`, graded by a separate judge model. Results for v1.0.0 (3 runs per case):

| Behaviour | Without the skill | With the skill |
|---|:---:|:---:|
| The skill loads by itself (plugin install) | | 🟢 18 of 18 runs |
| Bug fix comes with a test that reproduces the bug | 🔴 0 of 3 | 🟢 3 of 3 |
| Order code protects against double submits | 🟡 2 of 3 | 🟢 3 of 3 |
| A bill split adds up exactly to the total (no lost cents) | 🔴 1 of 3 | 🟢 3 of 3 |
| Editing a function with an N+1 query fixes it instead of extending it | 🟢 3 of 3 | 🟢 3 of 3 |
| An API field rename keeps old app versions working | 🟢 3 of 3 | 🟢 3 of 3 |
| A live database migration loses no data | 🟢 3 of 3 | 🟢 3 of 3 |
| A one-word typo fix stays short | 🟢 3 of 3 | 🟢 3 of 3 |
| Security basics (SQL injection, SSL, per-record access) | 🟢 9 of 9 | 🟢 9 of 9 |

The gain is in discipline, not knowledge: across all our runs, bug fixes without the skill loaded came with a reproducing test **0 times out of 21**, and every time with it. [Run the evals yourself](#evals).

## How it works

<p align="center">
  <img src="docs/assets/how-it-works.svg" alt="Six steps: 0 Size the task, 1 Understand, 2 Design, 3 Build, 4 Verify, 5 Report. Each step ends with a check." width="100%">
</p>

**Step 0 sizes the task**, so effort matches risk:

| Size | Examples | What runs |
|---|---|---|
| 🟢 **Trivial** | Typo, text or colour, rename, one config value | The change, the project's checks, one short sentence |
| 🟡 **Normal** | Feature, bug fix, new screen or endpoint | All five moments, tests by risk, a real-user test if users can see it |
| 🔴 **Complex** | Money, auth, permissions, personal data, migrations, concurrency, public APIs | Everything above, plus reference files in full, independent review, concurrency and stress checks |

`SKILL.md` stays short. The detailed rules live in `references/`, and the agent reads a file **only when the task touches its topic**:

| File | Read when the task… | Examples inside |
|---|---|---|
| `design.md` | creates a feature, module or abstraction | Reuse first, one job per piece, deep modules, Rule of Three |
| `structure.md` | creates files, names things, writes comments | Feature-first folders, honest names, comments that explain *why* |
| `correctness.md` | handles input, stored data, money or time | Parse at the edge, transactions, cents not floats, UTC |
| `security.md` | touches auth, permissions, secrets, files or dependencies | Injection, per-record access, known fixes for SSL, CORS and CSRF |
| `testing.md` | writes tests, or finishes a normal or complex task | Reproduce bugs first, real-user test, human-error checklist |
| `existing-code.md` | changes existing code, an API or a schema | House style, Chesterton's fence, safe migrations |
| `performance.md` | adds a query, network call, data loop or cache | No N+1, one call per moment, caches with a clearing plan |
| `resilience.md` | calls anything outside the process, or has a UI | Timeouts, safe retries, offline behaviour, regional blocks |
| `review.md` | reaches Verify or Report | Self-review checklist, reviewer brief, report template |

**What it costs:** loading the skill adds a few thousand tokens and one tool call per task. Reference files load only when the task touches their topic, so a trivial fix reads none. On real tasks, where the context is much larger, that is a small share.

**Who wins when rules disagree:** the user's direct instruction → the project's own rules (`CLAUDE.md`, `AGENTS.md`, …) → this skill. A MUST can be overridden only by the user explicitly, and the agent warns and records it.

## The MUST rules

Never skipped, at any task size.

| | # | Rule |
|---|:---:|---|
| 🔒 **Security** | 1 | Data never becomes code: no input glued into SQL, shell, HTML or file paths |
| | 2 | Check access on the server for every action **and every record** |
| | 3 | Never hand-roll auth or crypto |
| | 4 | Secrets stay out of code, git, logs, URLs and shipped apps |
| | 5 | Never weaken a safety check to make something work |
| 💾 **Data** | 6 | All-or-nothing writes, safe to repeat (no double charges) |
| | 7 | Never delete, drop or overwrite data without an explicit OK |
| | 8 | Never break what is shipped: old apps, public APIs, saved data |
| 🧾 **Honesty** | 9 | Prove it, don't claim it |
| | 10 | Never weaken a test to make it pass |
| | 11 | Never invent names, APIs or packages |
| | 12 | Fix the cause, not the symptom |
| ⚠️ **Actions** | 13 | Confirm before anything irreversible or touching production |

<details>
<summary><b>What a finished task looks like</b> (the report every normal or complex task ends with)</summary>

```text
What changed
  Invoices can take a discount code. New: discounts/ (model, api, tests).

Tested
  ✅ 14 unit tests (discount math, expiry, rounding)
  ✅ Browser test on staging: apply, remove, expired code
  ❌→✅ Code above the total gave −50: test added, fixed, retested

Numbers
  Invoice page: 4 queries → 4 (unchanged)

Not verified
  PDF export with a discount. To check: Export PDF → discount line appears.

Noticed, not touched
  invoices/list builds SQL with string concatenation. Suggest a separate fix.

⚠️ Warnings
  none
```

</details>

## Install

### Claude Code (plugin)

```
/plugin marketplace add Khodour/agent-skill-ultimate-coding
/plugin install agent-skill-ultimate-coding@agent-skill-ultimate-coding
```

### Any agent (copy the folder)

```bash
git clone https://github.com/Khodour/agent-skill-ultimate-coding.git
cp -r agent-skill-ultimate-coding/skills/agent-skill-ultimate-coding <skills-folder>/
```

Copy the whole folder, including `references/`.

| Agent | Personal skills folder | Project skills folder |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| OpenAI Codex | `~/.agents/skills/` | `.agents/skills/` |
| Cursor | `~/.cursor/skills/` or `~/.agents/skills/` | `.cursor/skills/` or `.agents/skills/` |
| Gemini CLI | `~/.gemini/skills/` or `~/.agents/skills/` | `.gemini/skills/` or `.agents/skills/` |
| GitHub Copilot | `~/.copilot/skills/` or `~/.agents/skills/` | `.github/skills/` or `.agents/skills/` |

Agents change their paths over time; check your agent's skills documentation if a folder is not picked up.

### Make it always on (recommended)

Agents decide for themselves when to load a skill, and for short requests ("here's a bug, fix it") they often skip it.

- **Claude Code plugin install:** nothing to do. The plugin ships a small startup hook (`hooks/hooks.json`) that tells each session to load the skill for every coding task. In our evals it loaded on every run.
- **Copied the folder, or using another agent:** add this line to your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For every coding task, load the agent-skill-ultimate-coding skill first and follow it.
```

## Evals

`evals/` holds real tasks run with and without the skill. With Claude Code:

```bash
claude plugin eval . --no-publish
```

This runs each case with the skill and without it (a baseline), grades both, and reports the difference.

## Repository layout

```
.claude-plugin/
  plugin.json, marketplace.json      Claude Code plugin and marketplace manifests
  icon.png                           plugin icon
skills/agent-skill-ultimate-coding/
  SKILL.md                           the skill: sizes, moments, MUSTs, routing
  references/                        detail files, read on demand
hooks/hooks.json                     startup hook: loads the skill for coding tasks
evals/                               test cases for `claude plugin eval`
docs/assets/                         images used by this README
```

## Contributing

Issues, forks and pull requests are welcome. Every rule must be language-neutral, explain what failure it prevents, and earn its place: if it doesn't change what an agent does, it doesn't belong.

## About the author

Built by **Khodour**, an Anthropic-certified AI architect and senior software engineer with 25+ years of shipping production software with large teams. The rules here come from that experience, and each one was checked with evals.

## License

[MIT](LICENSE): free to use, change, fork and share, including commercially. Keep the license notice in copies.

## Star history

<a href="https://star-history.com/#Khodour/agent-skill-ultimate-coding&Date">
  <img src="https://api.star-history.com/svg?repos=Khodour/agent-skill-ultimate-coding&type=Date" alt="Star history chart" width="600">
</a>
