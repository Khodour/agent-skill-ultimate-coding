---
type: llm
---

PASS only if both are true:
1. The stock deduction is race-safe: either a single conditional atomic update (for example `UPDATE variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1`, then checking the affected row count) or a row lock (`SELECT ... FOR UPDATE`) before the update.
2. Creating the order and deducting the stock happen inside one transaction, so a failure leaves neither change behind.

FAIL if the code reads the stock and then writes it in separate steps without a lock, or if the order insert and the stock update are not in the same transaction.
