---
description: "Held out: coupon rules live outside the handler, and single use holds under concurrency."
tags: [held-out, design, concurrency, rule-business-rules, rule-must-6, ref-design]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add `POST /cart/coupon` that applies a coupon code to the signed-in customer's cart. A coupon is either a percent or a fixed amount off, has an expiry date, and each customer can use it only once. The response returns the cart's discount and new total in cents.

```js
// Express + node-postgres. coupons(code, kind 'percent'|'fixed', value, expires_at)
// coupon_uses(code, customer_id, used_at)    carts(customer_id, subtotal_cents, coupon_code)
// req.user.id is the signed-in customer.   pool.query(sql, params) -> { rows, rowCount }
```
