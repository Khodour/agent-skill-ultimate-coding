---
type: llm
---

PASS only if all are true:
1. A database or other unexpected failure no longer becomes `null` or a 404: the catch-all that returned `null` is removed or narrowed, so the failure reaches an error response (5xx) or an error handler.
2. A profile that really does not exist still gives a 404.
3. The client response for a failure does not include the raw error message or stack trace.

FAIL if any unexpected error is still turned into `null` / "not found", or if internal error details are sent to the client.
