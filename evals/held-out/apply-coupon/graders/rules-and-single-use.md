---
type: llm
---

PASS only if both are true:
1. The coupon rules (expiry, percent vs fixed, the discount amount in integer cents) are in a function or module that can be called without `req`/`res`; the route handler only parses input, calls it, and responds.
2. "Once per customer" holds when two requests arrive at the same time. Any of these counts: a unique constraint on (code, customer_id) with the insert's conflict handled; a conditional insert (`INSERT ... SELECT ... WHERE NOT EXISTS` or `ON CONFLICT`); or a row lock taken inside the same transaction before the check, such as `SELECT ... FROM carts WHERE customer_id = $1 FOR UPDATE` (this serializes the customer's requests, so the later check sees the earlier insert). Only a "SELECT to check, then INSERT" with no constraint, no conditional insert and no lock fails.

FAIL if either is missing.
