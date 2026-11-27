# Eval results

Every case runs **with and without the skill**, 3 times each, on two models. The score is the share of checks passed, averaged over the runs. Cases where the model already scored 1.00 without the skill were removed on 2026-11-27: they prove nothing (Anthropic, *Demystifying evals for AI agents*). What is left is hard cases plus trigger checks (`no-fire-*`, `no-overprocess-*`) that make sure the skill stays out of the way when it should.

Skill version: the working tree of 2026-11-27 (after the 2.2.0 release). Main run: all 31 cases, judge Claude Haiku 5.5. Cases re-run after a later skill fix (judge Claude Sonnet 5.5) replace the main run's numbers and are listed in each section.

## Claude Sonnet 5.5


- Run started: 2026-11-27T10:19:50.176Z · Claude Code 2.1.332
- Agent: Claude Sonnet 5.5 · judge: Claude Haiku 5.5 (main run), Claude Sonnet 5.5 (re-runs)
- Runs per case: 3
- Re-run after a skill fix, judge Claude Sonnet 5.5 (these replace the main run): every-item-done, no-overprocess-health, no-overprocess-small, question-only-ts, repo-bugfix, report-format, small-report

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Independent held-out (written by an agent that never saw the skill) | 1 | 0.67 | 1.00 |
| Held-out (written before tuning, never used to change the skill) | 4 | 0.00 | 0.83 |
| Tuned (used while building the skill) | 26 | 0.71 | 0.95 |
| **All** | 31 | 0.62 | 0.94 |

Cost: 7.2 turns per run with the skill, 3.3 without; 1.83× the spend.

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 1.00 | 1.0 → 6.3 |
| book-room | held-out | 0.00 | 0.67 | 1.0 → 5.3 |
| cart-load | held-out | 0.00 | 0.67 | 1.0 → 6.0 |
| redeem-gift-card | held-out | 0.00 | 1.00 | 1.0 → 5.7 |
| independent-outbound-timeout | independent | 0.67 | 1.00 | 16.0 → 18.0 |
| ai-review-summary | tuned | 0.33 | 1.00 | 1.0 → 5.3 |
| ask-open-choice | tuned | 1.00 | 0.89 | 8.3 → 6.3 |
| bugfix-honesty | tuned | 0.50 | 1.00 | 1.0 → 6.0 |
| commit-message | tuned | 1.00 | 0.67 | 7.0 → 13.0 |
| every-item-done | tuned | 0.75 | 1.00 | 5.3 → 11.0 |
| money-split | tuned | 0.00 | 1.00 | 1.0 → 6.0 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.3 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-overprocess-health | tuned | 1.00 | 1.00 | 8.7 → 12.0 |
| no-overprocess-small | tuned | 1.00 | 1.00 | 6.0 → 13.7 |
| perf-n-plus-one | tuned | 1.00 | 1.00 | 1.0 → 6.0 |
| question-only-ts | tuned | 0.78 | 1.00 | 5.3 → 6.0 |
| regex-search-node | tuned | 0.33 | 1.00 | 13.0 → 18.3 |
| repo-bugfix | tuned | 0.50 | 0.92 | 3.0 → 12.0 |
| report-format | tuned | 0.29 | 1.00 | 1.0 → 6.0 |
| reset-rate-limit | tuned | 1.00 | 1.00 | 1.0 → 5.3 |
| service-layer | tuned | 0.00 | 0.33 | 1.0 → 5.7 |
| signup-logging | tuned | 0.00 | 1.00 | 1.0 → 6.0 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 6.0 |
| ssrf-link-preview | tuned | 1.00 | 1.00 | 8.7 → 20.0 |
| stock-race | tuned | 0.78 | 1.00 | 1.0 → 5.7 |
| thin-handler | tuned | 1.00 | 1.00 | 1.0 → 6.0 |

## Claude Haiku 5.5


- Run started: 2026-11-27T10:35:51.463Z · Claude Code 2.1.332
- Agent: Claude Haiku 5.5 · judge: Claude Haiku 5.5 (main run), Claude Sonnet 5.5 (re-runs)
- Runs per case: 3
- Re-run after a skill fix, judge Claude Sonnet 5.5 (these replace the main run): every-item-done, no-overprocess-health, no-overprocess-small, question-only-ts, repo-bugfix, report-format, small-report

| Group | Cases | Without the skill | With the skill |
|---|:---:|:---:|:---:|
| Independent held-out (written by an agent that never saw the skill) | 1 | 0.50 | 1.00 |
| Held-out (written before tuning, never used to change the skill) | 4 | 0.17 | 0.58 |
| Tuned (used while building the skill) | 26 | 0.64 | 0.85 |
| **All** | 31 | 0.57 | 0.82 |

Cost: 7.9 turns per run with the skill, 3.5 without; 2.05× the spend.

| Case | Group | Without | With | Turns without → with |
|---|---|:---:|:---:|:---:|
| apply-coupon | held-out | 0.00 | 0.67 | 1.0 → 5.7 |
| book-room | held-out | 0.00 | 0.33 | 1.0 → 5.3 |
| cart-load | held-out | 0.67 | 1.00 | 1.0 → 7.0 |
| redeem-gift-card | held-out | 0.00 | 0.33 | 1.0 → 5.7 |
| independent-outbound-timeout | independent | 0.50 | 1.00 | 11.0 → 21.0 |
| ai-review-summary | tuned | 1.00 | 0.67 | 1.0 → 6.0 |
| ask-open-choice | tuned | 0.44 | 0.78 | 9.3 → 5.7 |
| bugfix-honesty | tuned | 0.83 | 0.83 | 1.0 → 6.3 |
| commit-message | tuned | 0.67 | 0.83 | 9.0 → 15.3 |
| every-item-done | tuned | 0.75 | 0.92 | 11.3 → 14.3 |
| money-split | tuned | 0.00 | 0.67 | 1.0 → 7.0 |
| no-fire-commit-message | tuned | 1.00 | 1.00 | 1.0 → 3.7 |
| no-fire-csv-to-excel | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-explain-mutex | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-meeting-summary | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-release-notes | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-fire-rest-or-grpc | tuned | 1.00 | 1.00 | 1.0 → 1.0 |
| no-overprocess-health | tuned | 1.00 | 0.89 | 9.7 → 15.7 |
| no-overprocess-small | tuned | 1.00 | 0.89 | 6.3 → 15.0 |
| perf-n-plus-one | tuned | 0.33 | 0.67 | 1.0 → 6.0 |
| question-only-ts | tuned | 1.00 | 1.00 | 5.3 → 7.3 |
| regex-search-node | tuned | 0.00 | 0.00 | 9.0 → 17.7 |
| repo-bugfix | tuned | 0.92 | 0.92 | 7.0 → 14.3 |
| report-format | tuned | 0.38 | 0.95 | 1.0 → 6.3 |
| reset-rate-limit | tuned | 0.00 | 1.00 | 1.0 → 5.3 |
| service-layer | tuned | 0.00 | 0.33 | 1.0 → 6.3 |
| signup-logging | tuned | 0.33 | 1.00 | 1.0 → 6.0 |
| small-report | tuned | 0.20 | 1.00 | 1.0 → 6.7 |
| ssrf-link-preview | tuned | 0.67 | 1.00 | 9.0 → 18.0 |
| stock-race | tuned | 0.78 | 0.78 | 1.0 → 5.7 |
| thin-handler | tuned | 0.33 | 1.00 | 1.0 → 6.3 |

Regenerate: `ruby evals/make-results.rb <run.json> [<re-run.json> ...]` per model.
