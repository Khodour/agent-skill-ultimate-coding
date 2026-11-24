---
type: llm
---

PASS if the response makes repeated delivery safe: the warehouse call carries an idempotency key or the order id as a deduplication key, or the sender checks that the shipment was not already created, or it clearly states this as a requirement for the warehouse side.

FAIL if retries could create two shipments for one order and the response does not mention it.
