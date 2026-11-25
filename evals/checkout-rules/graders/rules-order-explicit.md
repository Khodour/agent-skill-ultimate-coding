---
type: llm
---

This case tests one thing: business rules that combine are applied in an order the reply states, not silently.

PASS only if both are true:
1. The reply states whether the $50 free-shipping threshold is checked before or after the member discount and the coupon (or asks the user, while giving code with a clearly stated default).
2. The code does what the reply says.

FAIL if the order is chosen silently, or the code contradicts the stated order. Other qualities (money type, examples, coupon edge cases) do not change the verdict.
