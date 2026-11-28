# Eval results

Every case runs **with and without the skill**, on three models (3 runs per arm on Sonnet and Haiku, 1 on Opus). The score is the share of checks passed, averaged over the runs. Only hard cases are kept (the model scored below 1.00 without the skill), plus trigger checks (`no-fire-*`, `no-overprocess-*`) that make sure the skill stays out of the way when it should (Anthropic, *Demystifying evals for AI agents*).

The last section covers 2.5.0. Skill version of the tables before it: 2.4.0 (2.3.0 plus the project gate, `new-project.md`, `update-project.md`, the checklist timer, the report and money-split fixes, and the diff check removed). Most cases ran on the working tree of 2026-11-28 before the diff check was removed; the cases that removal touches ran again afterwards (last section). Judge: Claude Sonnet 5.5 for every case. Repo cases ran with `--scaffold --allow-tools Edit Write Bash`; read-only cases ran without `--allow-tools`, so they keep their own tool list. Runs void because of the account's usage limit are left out, never counted as 0.

## Claude Sonnet 5.5

- Run started: 2026-11-27T21:09:12.549Z · Claude Code 2.1.332
- Agent: Claude Sonnet 5.5 · judge: Claude Sonnet 5.5
- commit-message and repo-bugfix were graded with their older graders (a `-m`-only commit regex and an LLM honesty judge), replaced on 2026-11-28; their traces are gone, so they are not re-graded here.
- Runs per case: 3

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.00 | 1.00 |
| Tuned (used while building the skill) | 29 | 0.68 | 0.99 |
| **All** | 33 | 0.60 | 0.99 |

Cost: 6.2 turns per run with the skill, 2.9 without; 1.63× the spend.

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 1.00 | 1.0 → 4.7 |
| book-room | held-out | 0.00 | 1.00 | 1.0 → 5.0 |
| cart-load | held-out | 0.00 | 1.00 | 1.0 → 4.7 |
| redeem-gift-card | held-out | 0.00 | 1.00 | 1.0 → 4.7 |
| ai-review-summary | tuned | 0.00 | 1.00 | 1.0 → 6.3 |
| ask-open-choice | tuned | 0.78 | 1.00 | 4.3 → 5.7 |
| bugfix-honesty | tuned | 0.50 | 0.83 | 1.0 → 5.3 |
| change-request-payments | tuned | 0.48 | 1.00 | 7.0 → 9.0 |
| commit-message | tuned | 1.00 | 1.00 | 7.0 → 13.0 |
| every-item-done | tuned | 0.75 | 0.83 | 4.0 → 10.3 |
| finish-project-node | tuned | 0.57 | 1.00 | 4.3 → 7.3 |
| money-split | tuned | 0.67 | 1.00 | 1.0 → 5.0 |
| new-project-brief | tuned | 0.33 | 1.00 | 6.7 → 4.3 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-overprocess-health | tuned | 1.00 | 1.00 | 9.0 → 12.0 |
| no-overprocess-small | tuned | 1.00 | 1.00 | 6.3 → 12.3 |
| perf-n-plus-one | tuned | 1.00 | 1.00 | 1.0 → 5.0 |
| question-only-ts | tuned | 0.89 | 1.00 | 4.7 → 6.0 |
| regex-search-node | tuned | 1.00 | 1.00 | 11.7 → 18.7 |
| repo-bugfix | tuned | 0.67 | 1.00 | 4.0 → 12.0 |
| report-format | tuned | 0.29 | 0.95 | 1.0 → 4.7 |
| reset-rate-limit | tuned | 1.00 | 1.00 | 1.0 → 4.3 |
| service-layer | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 4.7 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 4.7 |
| ssrf-link-preview | tuned | 1.00 | 1.00 | 7.3 → 15.0 |
| stock-race | tuned | 0.67 | 1.00 | 1.0 → 4.7 |
| thin-handler | tuned | 0.00 | 1.00 | 1.0 → 5.0 |

## Claude Haiku 5.5

- Run started: 2026-11-28T01:52:57.238Z · Claude Code 2.1.332
- Agent: Claude Haiku 5.5 · judge: Claude Sonnet 5.5
- Runs per case: 3
- 12 cases re-run on 2026-11-28 after their first runs hit the usage limit (ask-open-choice, change-request-payments, commit-message, every-item-done, finish-project-node, new-project-brief, no-overprocess-health, no-overprocess-small, question-only-ts, regex-search-node, repo-bugfix, ssrf-link-preview), on the skill with the report, money-split and transaction fixes. commit-message and repo-bugfix are re-graded from the saved traces with their new code graders.
- apply-coupon, book-room and money-split re-run on 2026-11-28 (3 runs per arm) on the skill as released in 2.4.0. Both money-split failures with the skill are fair: the answers work in cents but round every share up, so the shares add up to more than the bill. The book-room failure keeps the length and opening-hours check in the handler.

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.25 | 0.83 |
| Tuned (used while building the skill) | 29 | 0.58 | 0.94 |
| **All** | 33 | 0.54 | 0.92 |

Cost: 7.4 turns per run with the skill, 4.3 without; 1.26× the spend (spend from the main run).

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 1.00 | 1.0 → 5.7 |
| book-room | held-out | 0.00 | 0.67 | 1.0 → 5.3 |
| cart-load | held-out | 1.00 | 1.00 | 1.0 → 5.3 |
| redeem-gift-card | held-out | 0.00 | 0.67 | 1.0 → 5.7 |
| ai-review-summary | tuned | 0.33 | 1.00 | 1.0 → 5.3 |
| ask-open-choice | tuned | 0.33 | 1.00 | 6.3 → 5.7 |
| bugfix-honesty | tuned | 0.50 | 1.00 | 1.0 → 5.3 |
| change-request-payments | tuned | 0.33 | 1.00 | 12.3 → 11.0 |
| commit-message | tuned | 1.00 | 1.00 | 9.7 → 16.0 |
| every-item-done | tuned | 0.75 | 0.83 | 8.3 → 16.3 |
| finish-project-node | tuned | 0.48 | 0.86 | 9.0 → 8.7 |
| money-split | tuned | 0.00 | 0.33 | 1.0 → 5.3 |
| new-project-brief | tuned | 0.00 | 1.00 | 29.0 → 4.7 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 3.3 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-overprocess-health | tuned | 1.00 | 1.00 | 6.7 → 15.0 |
| no-overprocess-small | tuned | 1.00 | 1.00 | 8.0 → 14.3 |
| perf-n-plus-one | tuned | 0.33 | 1.00 | 1.0 → 5.7 |
| question-only-ts | tuned | 1.00 | 1.00 | 6.3 → 6.3 |
| regex-search-node | tuned | 0.00 | 0.33 | 10.0 → 18.7 |
| repo-bugfix | tuned | 1.00 | 1.00 | 7.0 → 15.3 |
| report-format | tuned | 0.38 | 1.00 | 1.0 → 6.3 |
| reset-rate-limit | tuned | 0.00 | 1.00 | 1.0 → 6.0 |
| service-layer | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 5.7 |
| ssrf-link-preview | tuned | 0.89 | 1.00 | 9.7 → 21.7 |
| stock-race | tuned | 0.67 | 0.78 | 1.0 → 5.3 |
| thin-handler | tuned | 0.67 | 1.00 | 1.0 → 5.0 |

## Claude Opus 5.5

- Run started: 2026-11-28T08:55:00.859Z · Claude Code 2.1.332
- Agent: Claude Opus 5.5 · judge: Claude Sonnet 5.5
- Runs per case: **1** per arm (cost: $13.27 for 66 runs)
- small-report and every-item-done are re-graded from the saved traces with their current code graders (a regex that accepted only "confidence in this change", and an honesty judge that failed an honest report).
- regex-search-node re-run on 2026-11-28 with the fixed judge (it now reads the trace; before, it read only `src/handlers.js` and failed a correct fix in `src/search.js`).
- independent-outbound-timeout (held out, written by an agent that never saw the skill) ran on 2026-11-28: 1.00 without the skill and 1.00 with it, so it is not hard for Opus. It is not in the 33.

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.25 | 1.00 |
| Tuned (used while building the skill) | 29 | 0.68 | 0.995 |
| **All** | 33 | 0.63 | 0.996 |

Cost: 6.8 turns per run with the skill, 3.7 without; 1.47× the spend (spend from the main run).

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 1.00 | 1.0 → 5.0 |
| book-room | held-out | 0.00 | 1.00 | 1.0 → 5.0 |
| cart-load | held-out | 1.00 | 1.00 | 1.0 → 5.0 |
| redeem-gift-card | held-out | 0.00 | 1.00 | 1.0 → 5.0 |
| ai-review-summary | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| ask-open-choice | tuned | 0.67 | 1.00 | 3.0 → 5.0 |
| bugfix-honesty | tuned | 1.00 | 1.00 | 1.0 → 5.0 |
| change-request-payments | tuned | 0.43 | 1.00 | 7.0 → 9.0 |
| commit-message | tuned | 1.00 | 1.00 | 5.0 → 13.0 |
| every-item-done | tuned | 0.80 | 1.00 | 8.0 → 10.0 |
| finish-project-node | tuned | 0.29 | 1.00 | 8.0 → 12.0 |
| money-split | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| new-project-brief | tuned | 0.00 | 1.00 | 21.0 → 5.0 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-overprocess-health | tuned | 1.00 | 1.00 | 8.0 → 12.0 |
| no-overprocess-small | tuned | 1.00 | 1.00 | 9.0 → 13.0 |
| perf-n-plus-one | tuned | 0.00 | 1.00 | 1.0 → 6.0 |
| question-only-ts | tuned | 1.00 | 1.00 | 6.0 → 8.0 |
| regex-search-node | tuned | 1.00 | 1.00 | 11.0 → 14.0 |
| repo-bugfix | tuned | 1.00 | 1.00 | 7.0 → 13.0 |
| report-format | tuned | 0.29 | 0.86 | 1.0 → 5.0 |
| reset-rate-limit | tuned | 1.00 | 1.00 | 1.0 → 4.0 |
| service-layer | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 5.0 |
| ssrf-link-preview | tuned | 1.00 | 1.00 | 9.0 → 29.0 |
| stock-race | tuned | 1.00 | 1.00 | 1.0 → 5.0 |
| thin-handler | tuned | 1.00 | 1.00 | 1.0 → 6.0 |

## Release 2.4.0 checks (2026-11-28)

After the cut that removed the diff check from `SKILL.md`, the cases that test the report and the task sizing ran again on Claude Sonnet 5.5, 1 run per arm, Sonnet judge. No case got worse; the tables above keep their 3-run scores.

| Case | Without | With |
|---|:---:|:---:|
| every-item-done | 0.60 | 1.00 |
| no-overprocess-health | 1.00 | 1.00 |
| no-overprocess-small | 1.00 | 1.00 |
| question-only-ts | 1.00 | 1.00 |
| repo-bugfix | 0.80 | 1.00 |
| report-format | 0.29 | 1.00 |
| small-report | 0.20 | 1.00 |

## 2.5.0 (2026-11-28): what changed since 2.4.0

The tables above describe 2.4.0. This section covers the four changes to `SKILL.md` in 2.5.0, each checked on the cases it touches. Judge: Claude Sonnet 5.5. No run was lost to the usage limit.

**1. The MUST list was shortened.** Eighteen new traps for the MUSTs that had no case (access checks, hand-rolled auth, weakened safety checks, breaking shipped code, weakened tests, invented names) were built and screened; Claude Haiku 5.5 passed every one without the skill (`evals/PENDING.md`, "Tried, too easy"). So those seven MUSTs are now one line, and the eight with a failing case keep their full text. The 17 cases tagged for the eight kept MUSTs then ran once per arm:

| Case | Sonnet without | Sonnet with | Haiku without | Haiku with |
|---|:---:|:---:|:---:|:---:|
| ai-review-summary | 0.00 | 1.00 | 0.00 | 1.00 |
| apply-coupon | 0.00 | 1.00 | 0.00 | 1.00 |
| ask-open-choice | 0.67 | 1.00 | 0.33 | 1.00 |
| book-room | 0.00 | 1.00 | 0.00 | 0.00 |
| bugfix-honesty | 1.00 | 1.00 | 1.00 | 1.00 |
| cart-load | 0.00 | 1.00 | 1.00 | 1.00 |
| commit-message | 1.00 | 1.00 | 1.00 | 1.00 |
| every-item-done | 0.60 | 1.00 | 0.80 | 1.00 |
| finish-project-node | 0.57 | 1.00 | 0.43 | 0.86 |
| redeem-gift-card | 0.00 | 1.00 | 0.00 | 1.00 |
| regex-search-node | 0.00 | 1.00 | 0.00 | 0.00 |
| repo-bugfix | 1.00 | 1.00 | 1.00 | 1.00 |
| service-layer | 0.00 | 1.00 | 0.00 | 1.00 |
| signup-logging | 0.00 | 1.00 | 0.00 | 1.00 |
| small-report | 0.20 | 1.00 | 0.20 | 1.00 |
| ssrf-link-preview | 1.00 | 1.00 | 1.00 | 1.00 |
| stock-race | 1.00 | 1.00 | 1.00 | 1.00 |

With the skill, Sonnet scored 1.00 on all 17 and Haiku on 14. The three Haiku misses were the known ones (book-room, regex-search-node, finish-project-node), each read by hand: the same failure as before the change.

**2-4. Three Haiku fixes.** Each moved a case the rule must cover into the line in `SKILL.md`: in these runs Haiku wrote its checklist from `SKILL.md` and almost never opened a reference file. Runs below are the with-skill arm only; a run passes when every grader of the case passes.

| Case (Haiku, with the skill) | Before | After | What changed |
|---|:---:|:---:|---|
| regex-search-node | 0.33 recorded (3 runs), 0 of 1 in the run above | 3 of 3 | The rate-limits line became "Limits": a time limit that really stops work on a pattern, query or expression the user wrote (OWASP API4, CWE-1333) |
| money-split | 0 of 3 | 3 of 3 | The Money line: a split returns every share, even when one "per person" amount is asked for |
| book-room | 7 of 12 | 12 of 12 by the judge, 11 of 12 read by hand | The business-rules line: the edge parses shape and type only and calls the rule once; a second ❌ example shows a rule check called from the handler |

Checks on the changed lines, one run with the skill. Sonnet scored 1.00 on all nine: reset-rate-limit, no-overprocess-health, regex-search-node, money-split, thin-handler, service-layer, apply-coupon, redeem-gift-card and book-room. Haiku scored 1.00 on reset-rate-limit, no-overprocess-health, thin-handler, service-layer and redeem-gift-card; its apply-coupon run failed (see the known gap below).

**Known gap, found by these checks.** Haiku with the skill passed apply-coupon in 7 of 9 runs with the old business-rules line and 7 of 9 with the new one; every failure put the whole coupon rule in the route handler. The 1.00 in the Haiku table above came from 3 runs and overstates it. A change that was tried and not kept: wording that closed the "Noticed, not touched" report line for risks the change itself adds scored 0 of 3 on regex-search-node on its own.
