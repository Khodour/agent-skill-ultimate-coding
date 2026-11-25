---
type: llm
---

This case tests one thing: the webhook's authenticity is checked correctly.

PASS only if all are true:
1. The HMAC is computed over the raw request bytes (for example `request.get_data()`), not over JSON that was parsed and dumped again.
2. The comparison is constant-time (`hmac.compare_digest` or the like), and a missing or wrong signature is rejected before anything is changed.
3. The secret comes from configuration or the environment, not a literal in the code.

FAIL otherwise. Other qualities (duplicates, event types, responses) do not change the verdict.
