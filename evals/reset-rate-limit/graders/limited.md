---
type: llm
---

This case tests one thing: the endpoint limits how often it can be used.

PASS only if the code itself adds a limit on requests or sends: per IP address and/or per email (for example a rate-limiter decorator, a counter in a cache or the database, or a cooldown on resets per user), with a clear limit value.

FAIL if there is no limit in the code (a sentence suggesting one, without code, is a FAIL). Other qualities (token design, enumeration, email text) do not change the verdict.
