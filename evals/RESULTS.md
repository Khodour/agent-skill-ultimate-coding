# Eval results

Every case runs **with and without the skill**, 3 times each, on two models. The score is the share of checks passed, averaged over the runs. Only hard cases are kept (the model scored below 1.00 without the skill), plus trigger checks (`no-fire-*`, `no-overprocess-*`) that make sure the skill stays out of the way when it should (Anthropic, *Demystifying evals for AI agents*).

Skill version: the working tree of 2026-11-28 (2.3.0 plus the project gate, `new-project.md`, `update-project.md` and the checklist timer). Judge: Claude Sonnet 5.5 for every case. Repo cases ran with `--scaffold --allow-tools Edit Write Bash`; read-only cases ran without `--allow-tools`, so they keep their own tool list. Runs void because of the account's usage limit are left out, never counted as 0.

## Claude Sonnet 5.5

- Run started: 2026-11-27T21:09:12.549Z · Claude Code 2.1.332
- Agent: Claude Sonnet 5.5 · judge: Claude Sonnet 5.5
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

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.25 | 0.58 |
| Tuned (used while building the skill) | 17 | 0.53 | 0.93 |
| **All** | 21 | 0.48 | 0.86 |

Cost: 4.3 turns per run with the skill, 1.0 without; 1.31× the spend.

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 0.33 | 1.0 → 5.0 |
| book-room | held-out | 0.00 | 0.33 | 1.0 → 5.0 |
| cart-load | held-out | 1.00 | 1.00 | 1.0 → 5.3 |
| redeem-gift-card | held-out | 0.00 | 0.67 | 1.0 → 5.7 |
| ai-review-summary | tuned | 0.33 | 1.00 | 1.0 → 5.3 |
| bugfix-honesty | tuned | 0.50 | 1.00 | 1.0 → 5.3 |
| money-split | tuned | 0.00 | 0.00 | 1.0 → 5.7 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 3.3 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| perf-n-plus-one | tuned | 0.33 | 1.00 | 1.0 → 5.7 |
| report-format | tuned | 0.38 | 1.00 | 1.0 → 6.3 |
| reset-rate-limit | tuned | 0.00 | 1.00 | 1.0 → 6.0 |
| service-layer | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 5.7 |
| stock-race | tuned | 0.67 | 0.78 | 1.0 → 5.3 |
| thin-handler | tuned | 0.67 | 1.00 | 1.0 → 5.0 |

Not run yet (every run hit the usage limit; re-run pending): ask-open-choice, change-request-payments, commit-message, every-item-done, finish-project-node, new-project-brief, no-overprocess-health, no-overprocess-small, question-only-ts, regex-search-node, repo-bugfix, ssrf-link-preview.
