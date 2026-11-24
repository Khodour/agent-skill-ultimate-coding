---
description: "Held out: a failed read must not look like an empty cart, or the next save wipes the real one."
tags: [held-out, correctness, errors, data-loss]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write `loadCart(userId)` and `addToCart(userId, item)` for our shop. Carts are stored in Redis as JSON under the key `cart:<userId>`.

```ts
// import { redis } from './redis';   redis.get(key): Promise<string | null>; redis.set(key, value): Promise<'OK'>
// type CartItem = { sku: string; qty: number };   type Cart = { items: CartItem[] };
```
