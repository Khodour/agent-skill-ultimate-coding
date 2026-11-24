---
description: A status change is a race-safe move with the allowed states in one place.
tags: [correctness, state-machine, concurrency]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add a `cancel_order(db, order_id)` function in Python. Customers can cancel an order only while it is pending or paid (paid ones are refunded later by a separate job).

Context:

```python
# orders table (PostgreSQL):
#   id SERIAL PRIMARY KEY
#   status TEXT NOT NULL   -- pending | paid | packed | shipped | delivered | cancelled
#   updated_at TIMESTAMPTZ NOT NULL
#
# db.execute(sql, params) -> number of rows changed
# db.fetchone(sql, params) -> dict or None
```
