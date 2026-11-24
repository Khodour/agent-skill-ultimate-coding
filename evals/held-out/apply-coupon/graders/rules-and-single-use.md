---
type: llm
---

PASS only if both are true:
1. The coupon rules (expiry, percent vs fixed, the discount amount in integer cents) are in a function or module that can be called without `req`/`res`; the route handler only parses input, calls it, and responds.
2. "Once per customer" holds when two requests arrive at the same time: a unique constraint on (code, customer_id) with the insert's conflict handled, or a lock / conditional insert in one transaction. A plain "SELECT to check, then INSERT" with no constraint or lock fails.

FAIL if either is missing.
