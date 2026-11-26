# Delivery: commits, pull requests, pipelines and releases

How a change travels from your editor to the people who use it. Read this when a task commits, opens a pull request, edits a changelog, or touches a CI/CD pipeline or a deployment.

**These are lasting principles, not copies of the standards.** Standards, platforms and their syntax change. When a detail matters (a commit convention's exact format, a CI platform's syntax, the current list of pipeline risks), the truth is, in this order: the project's own setup (its contributing guide, existing commits, its pipeline files), then the official documentation as it is today. Check them; do not trust memory or this file for the detail.

**Contents**
- 1 One change per commit
- 2 Messages that explain why
- 3 Small, and always working
- 4 The changelog, when the project keeps one
- 5 Pipelines are production code
- 6 Releases you can turn off and take back
- Sources

---

### 1. One change per commit

One commit, or one pull request, holds one self-contained change: everything it needs to work and be checked, and nothing else (see `existing-code.md`, rule 7).
- The change's tests travel with it, in the same commit.
- Restructuring and a behaviour change are separate commits, the restructuring first.
- An unrelated fix noticed on the way is its own commit, or a line in the report; never hidden in this one.

### 2. Messages that explain why

A commit message and a pull request description are read years later by someone who was not there.
- **First line:** what the change does, in the imperative, specific enough to understand without opening the diff: `Hide deleted products from search`, never `Fix bug` or `Update file`.
- **Body:** why: the problem, the reason for this approach, and any shortcoming or follow-up that is knowingly left.
- **Follow the project's convention.** Read its recent commits and contributing guide first. When it has none, a widely used one such as Conventional Commits (`feat:`, `fix:`, a mark on breaking changes) is a safe default.
- **Breaking changes are said out loud** in the message, never discovered later.
- Before committing, reread the message against the final diff: the change often moves during the work.

### 3. Small, and always working

- **Small batches.** Prefer several small changes, each working and checked, to one large one. An AI agent can produce a huge diff in minutes; reviewers cannot check it in minutes. Split it.
- **The main branch stays working.** Run the project's checks before each commit (`SKILL.md`, Verify). Never commit a known failing build. If a commit breaks the build and the fix is not quick, revert it first and fix it after.
- **Short-lived branches.** Merge back often; a branch that lives for weeks turns into a painful merge.

### 4. The changelog, when the project keeps one

- Add an entry for every change a user or another developer will notice, in the same change, under the section for the next, unreleased version.
- Group entries the way the file already does (for example Added, Changed, Deprecated, Removed, Fixed, Security). Write for humans: what changed for them, not the commit list.
- Deprecations, removals and breaking changes are always listed.

### 5. Pipelines are production code

A CI/CD pipeline can read secrets and deploy to production, so a change to it is reviewed and tested like any other code.
- **Never weaken a check to get green** (MUST 5): no skipped or deleted test steps, no "allow failure" on a failing step, no `|| true`, no bypass of required reviews or branch protection. Fix the cause; if the check itself is wrong, say why first (MUST 10).
- **Secrets in pipelines** (MUST 4): only the jobs that need a secret get it, with the least access that works; never print it, echo it or put it in a file that is kept as an artifact.
- **Untrusted code never runs with secrets.** Code from a pull request, a fork or an outside contributor runs without access to deploy keys or production secrets.
- **Pin what the pipeline pulls in.** Third-party actions, images and tools are pinned to an exact version or a content hash, not to a moving tag (see `security.md`, rule 9).
- **Check the syntax against the platform's current docs** (MUST 11): pipeline keys and options change between versions.

### 6. Releases you can turn off and take back

- A risky behaviour change ships with a way back (MUST 8): a switch that turns it off without a deploy, or a tested revert.
- **A release switch is temporary.** Plan its removal when you add it (a task, a date or a comment with the condition), and remove it once the change is proven. Every switch left in the code is a branch someone has to test.
- **Deploying is confirmed first** (MUST 13), and goes to a safe environment before production when the project has one.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Google Engineering Practices: [small changes](https://google.github.io/eng-practices/review/developer/small-cls.html), [change descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- DORA: [trunk-based development](https://dora.dev/capabilities/trunk-based-development/), [working in small batches](https://dora.dev/capabilities/working-in-small-batches/)
- [Keep a Changelog](https://keepachangelog.com/)
- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- Martin Fowler: [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html)
