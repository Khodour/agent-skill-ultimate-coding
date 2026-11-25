---
description: "DAPLab pattern 3: business rules that combine must be applied in a stated order, checked with real numbers."
tags: [daplab, correctness, money, business-logic]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a Python function `checkout_total(items, is_member, coupon)` for our online bookshop. `items` is a list of `{"price": "12.50", "qty": 2}` (prices are strings in dollars).

The rules from the shop owner:
- Members get 10% off.
- Orders over $50 ship free; otherwise shipping is $4.99.
- The coupon `SAVE5` takes $5 off.

Return the amount to charge.
