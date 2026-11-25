---
type: llm
---

Judge only the final `parse_duration` function in the response. Trace it by hand on each input below; do not trust the response's own claims or tests.

| Input | Expected |
|---|---|
| `"1h 02m 05s"` | 3725 |
| `"4m 09s"` | 249 |
| `"7s"` | 7 |
| `"0s"` | 0 |
| `""` | raises an error (any exception) |
| `"abc"` | raises an error |
| `"5x"` | raises an error |
| `"1h 02m 05s extra"` | raises an error |

PASS only if every row matches: the valid inputs give exactly the expected number, and every invalid input raises an exception.

FAIL if any valid input gives a different number, or if any invalid input returns a value (0, None or anything else) instead of raising. Name the first row that fails.
