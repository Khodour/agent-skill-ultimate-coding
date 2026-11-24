<p align="center">
  <img src=".claude-plugin/icon.png" alt="agent-skill-ultimate-coding icon" width="128">
</p>

# agent-skill-ultimate-coding

An [Agent Skill](https://agentskills.io) that makes coding agents work like a careful senior engineer: small, clear, safe code that is **proven before it is called done**.

It works for any programming language and any kind of software (web, mobile, APIs, command-line tools, games, embedded), and for any agent that reads the `SKILL.md` format. It is built first for Claude Code.

## Why another coding skill?

Most coding skills list principles every model already knows (SOLID, DRY, KISS). This one ties them to **the moments of a real task** and adds what generic lists skip:

- **Task sizing:** a typo fix stays light; payments, auth and migrations get the full treatment.
- **13 MUST rules** for the failures that cost the most: injection, broken access checks, leaked secrets, lost data, broken shipped apps, and the agent habits of claiming success without proof, weakening tests, inventing APIs, and switching off safety checks.
- **Proof before done:** tests by risk, a real-user test through the actual interface (including human mistakes), concurrency and stress checks by risk, and a fixed honest report.
- **Production reality:** load questions, caching with a clearing plan, offline behaviour, retries, races, regional blocks, backward compatibility.
- **Junior-friendly:** every question the agent asks comes with plain words, consequences and a recommended option.

## How it works

```
Step 0  Size the task      trivial · normal · complex
1       Understand         read project rules and code, find what exists, define "done"
2       Design             simplest shape, placement, data shape, load questions
3       Build              small steps, MUSTs, comments, focused changes
4       Verify             checks, tests by risk, real-user test, self-review, independent review
5       Report             what changed · tested · numbers · not verified · noticed · warnings
```

`SKILL.md` stays short (sizes, moments, MUSTs, routing). The details live in `references/`, which the agent reads only when the task needs them:

| File | Read when the task… |
|---|---|
| `design.md` | creates a feature, module or abstraction |
| `structure.md` | creates files, names things, writes comments |
| `correctness.md` | handles input, stored data, money or time |
| `security.md` | touches auth, permissions, secrets, files or dependencies |
| `testing.md` | writes tests, or finishes a normal or complex task |
| `existing-code.md` | changes existing code, an API or a schema |
| `performance.md` | adds a query, network call, data loop or cache |
| `resilience.md` | calls anything outside the process, or has a UI |
| `review.md` | reaches Verify or Report |

**Who wins when rules disagree:** the user's direct instruction → the project's own rules (`CLAUDE.md`, `AGENTS.md`, …) → this skill. The MUST rules can be overridden only by the user explicitly, and the agent warns and records it.

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

## Repository layout

```
.claude-plugin/marketplace.json        Claude Code plugin marketplace entry
skills/agent-skill-ultimate-coding/
  SKILL.md                             the skill
  references/                          detail files, read on demand
evals/                                 test cases for `claude plugin eval`
```

## Evals

`evals/` holds real tasks run with and without the skill, to prove it changes the result rather than assume it. With Claude Code:

```bash
claude plugin eval .
```

This runs each case with the skill and without it (a baseline), grades both, and reports the difference.

## Contributing

Issues, forks and pull requests are welcome. Every rule must be language-neutral, explain what failure it prevents, and earn its place: if it doesn't change what an agent does, it doesn't belong.

## License

[MIT](LICENSE): free to use, change, fork and share, including commercially. Keep the license notice in copies.
