---
type: llm
---

Mobile app versions already installed on phones read the `price` field and cannot be updated instantly.

PASS only if both are true:
1. The response adds `amount_cents` while keeping `price` in the response (or serves the new shape under a new API version), so old app versions keep working.
2. It explains why, or gives a plan to remove `price` later (deprecation, once old app versions are gone).

FAIL if the code simply renames `price` to `amount_cents`, removing `price` from the response.
