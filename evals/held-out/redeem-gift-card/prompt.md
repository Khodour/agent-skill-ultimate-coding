---
description: "Held out: gift card rules live outside the handler, every requirement is built, and the balance never goes negative under concurrency."
tags: [held-out, design, concurrency, completeness]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add `POST /orders/:id/gift-card` so the signed-in customer can pay part or all of an unpaid order with a gift card. An expired gift card is refused. The amount taken is the smaller of the card's balance and what is still due on the order. Every redemption is recorded in `gift_card_redemptions`. Two checkouts using the same card at the same time must never take the balance below zero.

```js
// Express + node-postgres. gift_cards(code, balance_cents, expires_at)
// orders(id, customer_id, total_cents, paid_cents, status 'unpaid'|'paid')
// gift_card_redemptions(code, order_id, amount_cents, redeemed_at)
// req.user.id is the signed-in customer.   pool.query(sql, params) -> { rows, rowCount }
```
