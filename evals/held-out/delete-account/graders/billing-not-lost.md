---
type: llm
---

PASS only if the subscription cancellation cannot be lost or left half done: either it is recorded durably in the same transaction as the deletion (an outbox or job row that a worker retries), or the code cancels billing first and deletes only after it succeeds, with a clear error and no deletion when billing fails. Calls to outside services must not run inside the database transaction before the commit.

FAIL if the account data can be deleted while the billing cancellation fails and is simply logged or ignored (the customer keeps being charged), or if outside calls run inside the open transaction.
