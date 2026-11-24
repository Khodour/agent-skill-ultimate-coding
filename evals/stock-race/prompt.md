---
description: Stock deduction must be atomic and race-safe; repeat submissions considered.
tags: [correctness, concurrency]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write `placeOrder(db, variantId, qty)` in TypeScript. It creates the order and deducts the stock. It is called from our checkout endpoint.

Context:

```ts
// Tables (PostgreSQL):
//   variants(id INTEGER PRIMARY KEY, stock INTEGER NOT NULL)
//   orders(id SERIAL PRIMARY KEY, variant_id INTEGER NOT NULL, qty INTEGER NOT NULL,
//          created_at TIMESTAMPTZ NOT NULL DEFAULT now())
//
// db.query(sql: string, params: unknown[]) => Promise<{ rows: any[]; rowCount: number }>
// db.transaction(async (tx) => { ... })   // tx has the same query() method
```
