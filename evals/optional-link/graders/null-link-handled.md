---
type: llm
---

This case tests one thing: an order whose `shipfast_shipment_id` is null (never shipped) is handled on purpose.

PASS only if the code never calls `shipfast.cancel_shipment` with `None`: when the id is null it skips the carrier call (or returns a clear result or error that says there is no shipment), and still treats the order cancellation sensibly.

FAIL if any path can call `shipfast.cancel_shipment(None)` (or with a null/empty id), or if the null case is not handled at all. Other qualities (transactions, retries, status rules) do not change the verdict.
