---
type: llm
---

PASS only if both toast messages go through `t(...)` with keys (and the response adds or names the keys for the locale files), with no English sentence hard-coded in the code, and the error toast is shown when saving fails (the failure is caught or handled, not left as an unhandled rejection).

FAIL if a toast message is a hard-coded English string, or if a failed save shows no error toast.
