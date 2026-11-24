---
description: "Held out: shipping an order is a race-safe state move, though the request never says so."
tags: [held-out, correctness, state-machine]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add an endpoint `POST /orders/:id/ship` that marks an order as shipped and saves the tracking number from the request body.

```js
// Express + node-postgres. orders(id, status, tracking_number, updated_at)
// status is one of: pending, paid, packed, shipped, delivered, cancelled
// const { pool } = require('../db');   pool.query(sql, params) -> { rows, rowCount }
```
