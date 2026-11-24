---
description: A new business rule goes in its own function, not inside the route handler.
tags: [design, layering]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add a rule: members with the "gold" tier get 10% off orders over $100. Here is our checkout route.

```js
// routes/checkout.js (Express)
router.post('/checkout', async (req, res) => {
  const user = await users.find(req.session.userId);
  const cart = await carts.forUser(user.id);
  const totalCents = cart.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const order = await orders.create({ userId: user.id, totalCents });
  res.json({ orderId: order.id, totalCents });
});
```
