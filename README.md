<div align="center">

<img src=".claude-plugin/icon.png" alt="agent-skill-ultimate-coding: a pixel-art engineer bot with a hard hat, a shield with a check mark, and a wrench" width="140">

# agent-skill-ultimate-coding

### Senior-engineer discipline for AI coding agents, in any language.

**Small, clear, safe code that is _proven_ before it is called done.**

Light and powerful: a small core of about 4k tokens that pulls in detail only when the task needs it.

[![GitHub stars](https://img.shields.io/github/stars/Khodour/agent-skill-ultimate-coding?style=flat-square&logo=github)](https://github.com/Khodour/agent-skill-ultimate-coding/stargazers)
[![Version](https://img.shields.io/badge/dynamic/json?style=flat-square&label=version&color=C96A43&url=https%3A%2F%2Fraw.githubusercontent.com%2FKhodour%2Fagent-skill-ultimate-coding%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-A9502E?style=flat-square)](#install)
[![Evals](https://img.shields.io/badge/evals-with%20vs%20without-2EA44F?style=flat-square)](#how-it-powers-up-the-agent)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Khodour%20Fouani-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kodr-fouani-b75523179/)

**[Install](#install) · [What it solves](#what-it-solves) · [Proof](#how-it-powers-up-the-agent) · [Contributing](#contributing)**

<sub>Works in any language, including</sub><br>
![TypeScript](https://img.shields.io/badge/TypeScript-30363d?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-30363d?style=flat-square&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-30363d?style=flat-square&logo=javascript&logoColor=white)
![Java](https://img.shields.io/badge/Java-30363d?style=flat-square&logo=openjdk&logoColor=white)
![C#](https://img.shields.io/badge/C%23-30363d?style=flat-square&logo=dotnet&logoColor=white)
![Go](https://img.shields.io/badge/Go-30363d?style=flat-square&logo=go&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-30363d?style=flat-square&logo=php&logoColor=white)
![C++](https://img.shields.io/badge/C%2B%2B-30363d?style=flat-square&logo=cplusplus&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-30363d?style=flat-square&logo=rust&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-30363d?style=flat-square&logo=kotlin&logoColor=white)
![Swift](https://img.shields.io/badge/Swift-30363d?style=flat-square&logo=swift&logoColor=white)
![Ruby](https://img.shields.io/badge/Ruby-30363d?style=flat-square&logo=ruby&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-30363d?style=flat-square&logo=dart&logoColor=white)

</div>


---

## Install

**Claude Code (plugin):**

```
/plugin marketplace add Khodour/agent-skill-ultimate-coding
/plugin install agent-skill-ultimate-coding@agent-skill-ultimate-coding
```

The plugin loads the skill for every coding task and shows the agent's checklist above the input while it works (switch it off in `/config` if you prefer).

**Other agents:** copy the `skills/agent-skill-ultimate-coding/` folder into your agent's skills folder (for example `~/.agents/skills/` for Codex, Cursor, Gemini CLI and Copilot), and add this line to your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For every coding task, load the agent-skill-ultimate-coding skill first and follow it.
```

## What it solves

AI agents write code that **works**. Too often it is also **spaghetti**: tasty today, impossible to untangle tomorrow. Each picture is the same task: without the skill on the left, with it on the right.

### 🍝 A bowl of spaghetti → 🍕 a neatly sliced pizza

<p align="center"><img src="docs/assets/before-after-spaghetti.svg" alt="Without the skill: a 1,240-line routes file tangled with utils, an old utils copy, helpers, db, email and config, with SQL built from input, code copied three times, a key in the code and no tests. With the skill: routes, service and repository layers, each with one job, tests passing 12 of 12, access checked, secrets in the environment, safe to retry." width="100%"></p>

### 🗂️ "Where's checkout?" → planned first, sliced by feature

<p align="center"><img src="docs/assets/before-after-structure.svg" alt="Without the skill: everything in a 2,400-line app.js, utils and utils2 with the same code, final_FINAL.js, an empty test file and a committed .env. With the skill: docs/project.md with scope and sprints, one folder per feature with routes, service, repository and tests beside the code, and a .env.example so secrets stay out of git." width="100%"></p>

### 🔒 An open front door → a bouncer on every route

<p align="center"><img src="docs/assets/before-after-security.svg" alt="Without the skill: the order id glued into SQL, the request body with the password logged, no check that the order belongs to the user, a key in the code; the attack id 7 OR 1=1 returns every customer's orders. With the skill: the order is fetched for this user only with query parameters, 404 by default, the key from the environment; the same attack gets 404 Not Found." width="100%"></p>

### ♻️ Double click, double trouble → click twice, sell once

<p align="center"><img src="docs/assets/before-after-reliability.svg" alt="Without the skill: two clicks on Buy with one item left both sell, stock goes to minus one; $100.00 split three ways gives 99.99. With the skill: one atomic update, the second click gets sold out; the split is 33.34, 33.33 and 33.33, exactly 100.00." width="100%"></p>

### 🧪 "Fixed!" (it was not) → receipts, not vibes

<p align="center"><img src="docs/assets/before-after-proof.svg" alt="Without the skill: the agent says fixed with no test run, and two days later production throws total is NaN. With the skill: a test that fails first, the cause fixed, tests 42 of 42 after the last edit, a red line for what was not tried, and an honest medium confidence line with options." width="100%"></p>

### 🤝 Mind reading → asking first

<p align="center"><img src="docs/assets/before-after-asks.svg" alt="Without the skill: asked for a job that deletes old orders, the agent guesses 30 days and deletes paid orders too. With the skill: two questions with a recommended option each, safe defaults named for the rest, and nothing deleted until you choose." width="100%"></p>

### 🧭 Rewrites first → reads the room first

<p align="center"><img src="docs/assets/before-after-change-request.svg" alt="Without the skill: told to finish the project, the agent writes 14 files, rebuilds an existing login and breaks 12 tests. With the skill: it shows what is done, half-built and missing, runs the tests, asks two questions, writes a change request file, and writes no code until you confirm." width="100%"></p>

### ⚖️ A 9-step plan for a typo → a typo fix for a typo

<p align="center"><img src="docs/assets/before-after-right-sized.svg" alt="Without the skill: a question about a slow page gets a six-file rewrite, and a typo gets a nine-step plan. With the skill: the question gets the cause and an offer to fix it, and the typo gets a one-line change." width="100%"></p>

Your instructions and your project's own rules always come first. The skill is the sous-chef, not the head chef.

## How it powers up the agent

Every case runs the same task **with and without** the skill, and graders check the result. Only hard cases are kept: a task the model already gets right on its own proves nothing, so it is removed. Grey is without the skill, green is with it.

<p align="center"><img src="docs/assets/chart-sonnet.svg" alt="Claude Sonnet 5.5: 60% of checks passed without the skill, 99% with it. Organized code 0% to 100%, secure by default 60% to 100%, reliable data 59% to 100%, proven and honest 48% to 92%, asks and plans first 54% to 100%, right-sized 99% to 100%." width="100%"></p>

<p align="center"><img src="docs/assets/chart-opus.svg" alt="Claude Opus 5.5: 63% of checks passed without the skill, 99.6% with it. Organized code 20% to 100%, secure by default 60% to 100%, reliable data 50% to 100%, proven and honest 66% to 97%, asks and plans first 35% to 100%, right-sized 100% both ways." width="100%"></p>

<p align="center"><img src="docs/assets/chart-haiku.svg" alt="Claude Haiku 5.5: 54% of checks passed without the skill, 92% with it. Organized code 13% to 87%, secure by default 24% to 87%, reliable data 50% to 78%, proven and honest 57% to 97%, asks and plans first 29% to 97%, right-sized 100% both ways." width="100%"></p>

2026-11-28, Sonnet judge, 33 cases: 3 runs per case on Sonnet and Haiku, 1 on Opus. "Right-sized" checks that the skill stays out of the way (questions, small tasks, non-coding requests), so the same score both ways is the goal. Every case, every score and the few where the skill did not help are in [evals/RESULTS.md](evals/RESULTS.md). The extra care costs about twice the turns of an agent working without it.

## Run the evals yourself

```bash
CLAUDE_CODE_ENABLE_TODO_TOOLS=1 claude plugin eval . --scaffold --no-publish \
  --model sonnet --judge-model sonnet --runs 3 \
  --allow-tools Edit Write ToolSearch TaskCreate TaskUpdate "Bash(python3 -m unittest:*)" "Bash(node --test:*)"
```

Some cases build a small sample project (`--scaffold`); read their `scaffold.sh` first. Without `--allow-tools` the agent cannot edit files or run tests, and every case fails.

## Contributing

Issues and pull requests are welcome. A new rule must come from a trusted source (OWASP, NIST, CWE, official vendor docs), work in any language, and come with an eval that fails without the skill.

## About the author

Built by **[Khodour](https://www.linkedin.com/in/kodr-fouani-b75523179/)**, an Anthropic-certified AI architect and senior software engineer with more than 25 years of experience shipping production software with large teams.

## License

[MIT](LICENSE). Free to use, modify and share, including for commercial use.
