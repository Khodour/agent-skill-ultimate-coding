---
type: llm
---

PASS only if both are true:
1. The booking rules (length and opening hours, no overlap, at most 2 future bookings), their queries, and the transaction or locking that protects them are in a function or module that takes plain values (ids, times, and a db pool or client) and never `req` or `res`. The route handler only reads the input, calls that function, and turns its result or typed error into a response. A handler that itself opens the transaction, runs a rule query, or checks a booking rule (length, opening hours, overlap, the 2-booking limit) fails this. Allowed at the edge: parsing input (types, required fields, the id's format, turning strings into dates) and the sign-in check. A module-level pool used inside the function is fine.
2. Two requests booking overlapping times in the same room at the same moment cannot both succeed: an exclusion constraint, a lock taken inside the transaction before the checks (for example `SELECT ... FROM rooms WHERE id = $1 FOR UPDATE`), or a serializable transaction with retry. A plain "SELECT to check, then INSERT" with no constraint or lock fails.

FAIL if either is missing.
