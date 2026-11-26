---
type: llm
---

This case tests one thing: business rules that combine are applied in an order the reply states, not silently.

PASS in either of these two cases:
A. The reply states whether the $50 free-shipping threshold is checked before or after the member discount and the coupon, and the code does what the reply says.
B. The reply writes no code yet and asks the user which order to use (the threshold before or after the discounts), with options to choose from and one marked recommended. Since the skill's ask-first rule (a choice that changes what customers pay is put to the user before building), asking and waiting is a correct answer here.

FAIL if the order is chosen silently, if the code contradicts the stated order, or if the reply asks without naming the order question. Other qualities (money type, examples, coupon edge cases) do not change the verdict.
