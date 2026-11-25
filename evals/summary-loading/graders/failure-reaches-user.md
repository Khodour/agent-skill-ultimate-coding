---
type: llm
---

This case tests one thing: a failed call must end the loading state and reach the user.

PASS only if both are true:
1. When `api.summarize` rejects, the "Generating…" state ends (for example in a catch or finally).
2. The user sees that it failed in the UI (any message; a console log alone does not count).

FAIL if a rejected call can leave the panel showing "Generating…" forever, or the error is only logged. Other qualities (double clicks, stale responses, message wording) do not change the verdict.
