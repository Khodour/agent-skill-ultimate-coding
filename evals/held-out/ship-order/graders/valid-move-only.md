---
type: llm
---

PASS only if both are true:
1. An order can be shipped only from the statuses that allow it (for example `paid` or `packed`); shipping a pending, cancelled, delivered or already shipped order is refused with a clear error, not silently done.
2. The check cannot race: the UPDATE itself includes the allowed current statuses in its WHERE clause and checks the rows changed, or the row is locked (`SELECT ... FOR UPDATE` in a transaction) before it is checked and updated.

FAIL if any order can be marked shipped regardless of its current status, or if the status is read and then written in separate steps with no lock.
