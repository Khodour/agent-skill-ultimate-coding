---
type: llm
weight: 0.5
---

PASS if the response deals with the same order being submitted twice (double click, client retry, network retry): for example an idempotency key or unique request ID, or it clearly flags this as a remaining risk with a suggested fix.

FAIL if repeated submissions are not mentioned at all.
