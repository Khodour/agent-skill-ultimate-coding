---
type: llm
---

This case tests one thing: an edit based on an old copy of the note cannot silently overwrite someone else's newer edit.

PASS only if the update is conditional on the version the client last saw (a version number or the `updated_at` it loaded, sent by the client and checked in the UPDATE's WHERE clause, or an If-Match/ETag check), and a mismatch returns a conflict (for example 409 or 412) instead of saving.

FAIL if the last write simply wins. Other qualities (validation, auth, response shape) do not change the verdict.
