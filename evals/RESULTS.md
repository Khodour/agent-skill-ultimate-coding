# Eval results

Every case runs **with and without the skill**, on three models (3 runs per arm on Sonnet and Haiku, 1 on Opus). The score is the share of checks passed, averaged over the runs. Only hard cases are kept (the model scored below 1.00 without the skill), plus trigger checks (`no-fire-*`, `no-overprocess-*`) that make sure the skill stays out of the way when it should (Anthropic, *Demystifying evals for AI agents*).

Skill version: the working tree of 2026-11-28 (2.3.0 plus the project gate, `new-project.md`, `update-project.md` and the checklist timer). Judge: Claude Sonnet 5.5 for every case. Repo cases ran with `--scaffold --allow-tools Edit Write Bash`; read-only cases ran without `--allow-tools`, so they keep their own tool list. Runs void because of the account's usage limit are left out, never counted as 0.

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
- apply-coupon, book-room and money-split scores come from the earlier run, before their fixes; not re-run (test budget).

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.25 | 0.58 |
| Tuned (used while building the skill) | 29 | 0.58 | 0.92 |
| **All** | 33 | 0.54 | 0.88 |

Cost: 7.4 turns per run with the skill, 4.3 without; 1.26× the spend.

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 0.33 | 1.0 → 5.0 |
| book-room | held-out | 0.00 | 0.33 | 1.0 → 5.0 |
| cart-load | held-out | 1.00 | 1.00 | 1.0 → 5.3 |
| redeem-gift-card | held-out | 0.00 | 0.67 | 1.0 → 5.7 |
| ai-review-summary | tuned | 0.33 | 1.00 | 1.0 → 5.3 |
| ask-open-choice | tuned | 0.33 | 1.00 | 6.3 → 5.7 |
| bugfix-honesty | tuned | 0.50 | 1.00 | 1.0 → 5.3 |
| change-request-payments | tuned | 0.33 | 1.00 | 12.3 → 11.0 |
| commit-message | tuned | 1.00 | 1.00 | 9.7 → 16.0 |
| every-item-done | tuned | 0.75 | 0.83 | 8.3 → 16.3 |
| finish-project-node | tuned | 0.48 | 0.86 | 9.0 → 8.7 |
| money-split | tuned | 0.00 | 0.00 | 1.0 → 5.7 |
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
- regex-search-node with the skill scores 0.00 as graded, but its answer is correct (a worker thread terminated after 2 s, read by hand): the judge read only `src/handlers.js` and the code was in `src/search.js`. The judge now reads the trace; the case is not re-run (test budget).
- independent-outbound-timeout did not run (its folder name differs from its case name, so `--case` matched nothing).

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Held-out (written before tuning, never used to change the skill) | 4 | 0.25 | 1.00 |
| Tuned (used while building the skill) | 29 | 0.68 | 0.96 |
| **All** | 33 | 0.63 | 0.97 |

Cost: 6.8 turns per run with the skill, 3.7 without; 1.47× the spend.

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
| regex-search-node | tuned | 1.00 | 0.00 | 9.0 → 14.0 |
| repo-bugfix | tuned | 1.00 | 1.00 | 7.0 → 13.0 |
| report-format | tuned | 0.29 | 0.86 | 1.0 → 5.0 |
| reset-rate-limit | tuned | 1.00 | 1.00 | 1.0 → 4.0 |
| service-layer | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 5.0 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 5.0 |
| ssrf-link-preview | tuned | 1.00 | 1.00 | 9.0 → 29.0 |
| stock-race | tuned | 1.00 | 1.00 | 1.0 → 5.0 |
| thin-handler | tuned | 1.00 | 1.00 | 1.0 → 6.0 |
