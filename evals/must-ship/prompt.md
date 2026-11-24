---
description: A side effect that must happen is recorded in the same transaction and retried, not lost.
tags: [correctness, side-effects, resilience]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

When an order is paid we call the warehouse API so the order ships. Sometimes the warehouse API is down, and those orders never ship. Fix `mark_paid`.

```python
# orders/payment.py
def mark_paid(db, warehouse, order_id):
    """Called by the payment webhook when the customer's payment succeeds."""
    with db.transaction():
        db.execute("UPDATE orders SET status = 'paid' WHERE id = %s", (order_id,))
    warehouse.create_shipment(order_id)   # sometimes times out or returns 503
```
