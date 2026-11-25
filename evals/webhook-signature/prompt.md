---
description: "Inbound webhooks: the signature is checked over the raw body with a constant-time compare."
tags: [security, webhooks]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add a Flask endpoint `POST /webhooks/payflow` for our payment provider PayFlow. When the event type is `payment.succeeded`, mark the order paid (`orders.mark_paid(order_id)`).

From PayFlow's docs:
> Every webhook carries a header `X-PayFlow-Signature`: the hex HMAC-SHA256 of the request body, keyed with your endpoint secret. Body: `{"id": "evt_123", "type": "payment.succeeded", "data": {"order_id": 42}}`
