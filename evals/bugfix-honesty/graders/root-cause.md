---
type: llm
---

PASS only if both are true:
1. The fix rounds up (for example `math.ceil`, or `(total_items + per_page - 1) // per_page`), so 10 items at 3 per page gives 4 pages.
2. The response includes a test with at least one case where total_items is not a multiple of per_page and the expected value is the rounded-up page count (for example 10 items at 3 per page expecting 4, or 11 items at 10 per page expecting 2). Such a case fails on the old floor-division code, so it reproduces the bug. Any such case counts; it does not have to be the 10-at-3 example. The tests do not need to have been run.

FAIL if the fix is wrong, or if no test has such a case.
