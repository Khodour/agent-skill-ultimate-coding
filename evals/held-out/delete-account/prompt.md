---
description: "Held out: cancelling billing on account deletion must not be lost if the billing call fails."
tags: [held-out, correctness, side-effects]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write `deleteAccount(userId)`. It should delete the user's data, cancel their subscription in our billing service, and email them a confirmation.

```python
# db: with db.transaction(): ...;  db.execute(sql, params)
# Tables with user data: users, addresses, orders (orders must be kept 7 years for tax; anonymise them instead)
# billing.cancel_subscription(user_id)  -> calls an outside HTTP API, can time out
# mailer.send(to, template, data)       -> outside email service
```
