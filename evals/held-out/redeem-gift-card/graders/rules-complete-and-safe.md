---
type: llm
---

PASS only if all three are true:
1. The gift card rules (the expiry check and the amount taken = the smaller of the balance and the amount still due, in integer cents) are in a function or module that can be called without `req`/`res`; the route handler only parses input, calls it, and responds.
2. Every stated requirement is built: expired cards refused, the amount is min(balance, due), the order's paid amount (and status when fully paid) is updated, and a `gift_card_redemptions` row is written.
3. The balance cannot go below zero when two requests use the same card at once: an atomic conditional update (for example `UPDATE ... SET balance_cents = balance_cents - $1 WHERE code = $2 AND balance_cents >= $1` with the row count checked), or the card row locked with `SELECT ... FOR UPDATE` inside one transaction that also does the other writes. A plain read-then-write with no lock fails.

FAIL if any of the three is missing.
