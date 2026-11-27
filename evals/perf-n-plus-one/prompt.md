---
description: Touching a function with an N+1 query should fix it, not add to it.
tags: [performance, existing-code, rule-house-style, ref-performance, ref-existing-code]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add the customer's email to each order in this response.

```python
# orders/recent.py

def recent_orders(db):
    """Last 50 orders for the admin dashboard."""
    orders = db.query(
        "SELECT id, customer_id, total_cents FROM orders ORDER BY created_at DESC LIMIT 50", []
    )
    result = []
    for o in orders:
        c = db.query("SELECT name FROM customers WHERE id = ?", [o["customer_id"]])[0]
        result.append({"id": o["id"], "total_cents": o["total_cents"], "customer": c["name"]})
    return result
```

`db.query(sql, params)` returns a list of dict rows.
