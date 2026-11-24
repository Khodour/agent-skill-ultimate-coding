---
type: llm
---

PASS only if both are true:
1. The fix rounds up (for example `math.ceil`, or `(total_items + per_page - 1) // per_page`), so 10 items at 3 per page gives 4 pages.
2. The response includes a test that reproduces the bug (it would fail on the old code, for example 10 items at 3 per page expecting 4).

FAIL if the fix is wrong, or if no test reproducing the bug is given.
