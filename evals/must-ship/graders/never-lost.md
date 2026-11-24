---
type: llm
---

PASS only if the shipment request can no longer be lost: the intent to ship is stored durably **in the same transaction** as the status change (for example an outbox row, a job row, or a durable queue message written inside that transaction), and something (a worker, a scheduled job) sends it later with retries until it succeeds.

FAIL if the fix only retries the call inline (a loop, a retry decorator, a try/except), because the request is still lost when every retry fails or the process stops before it succeeds. Also FAIL if the shipment is requested inside the transaction before the commit, so a rollback could leave a shipment for an unpaid order.
