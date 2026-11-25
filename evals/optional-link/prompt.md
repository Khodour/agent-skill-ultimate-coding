---
description: "Null-link edge: a record that was never linked to an outside service must not be sent to it with a null id."
tags: [correctness, integration, edges]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a Python function `cancel_order(conn, order_id)` for our shop. It marks the order as cancelled and cancels its shipment at our carrier, ShipFast.

```python
# Table: orders(id bigint primary key, status text, shipfast_shipment_id text null, updated_at timestamptz)
# conn is a psycopg 3 connection.
# shipfast.cancel_shipment(shipment_id: str) -> None   # raises shipfast.ApiError on failure
```
