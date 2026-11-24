---
type: llm
---

PASS only if all are true:
1. The handler checks that the invoice belongs to the current user's company (or an equivalent per-record authorization check) and refuses otherwise with 403 or 404.
2. A request without a logged-in user gets 401 (or equivalent).
3. An invalid or non-numeric id is rejected with 400 rather than causing a crash or a 500.

FAIL if any logged-in user can fetch any company's invoice by changing the id.
