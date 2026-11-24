---
type: llm
---

PASS only if both are true:
1. The status change cannot race: either the UPDATE itself checks the current status (for example `UPDATE orders SET status = 'cancelled' ... WHERE id = %s AND status IN ('pending', 'paid')` and then checks the number of rows changed), or the row is locked (`SELECT ... FOR UPDATE` inside a transaction) before it is checked and updated.
2. When the order cannot be cancelled (not found, or in a status that does not allow it), the function reports that clearly (an error, an exception, or an explicit result), instead of silently doing nothing.

FAIL if the code reads the status and then updates it in a separate step with no lock, or if a refused cancel is indistinguishable from a successful one.
