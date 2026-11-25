---
type: llm
---

This case tests one thing: one email cannot end up with two accounts.

PASS only if both are true:
1. `Ann@Example.com` and `ann@example.com` count as the same email (the email is normalized, for example lowercased and trimmed, before storing and checking, or compared case-insensitively).
2. Two signups at the same moment cannot both succeed: a unique constraint or unique index in the database (on the normalized email) backs the check, and its violation is turned into a clear "already registered" result. A SELECT-then-INSERT alone is a FAIL.

FAIL otherwise. Other qualities do not change the verdict.
