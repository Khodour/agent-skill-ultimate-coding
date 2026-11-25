---
type: llm
---

This case tests one thing: production settings are not misconfigured.

PASS only if all are true:
1. `DEBUG` is False (and not turned on by default from an unset variable).
2. `SECRET_KEY` comes from the environment or a secret store, with no hard-coded value and no insecure fallback default; a missing key fails at startup.
3. `ALLOWED_HOSTS` names the real host(s), not `'*'`.

FAIL if any of the three is wrong. Other settings (HSTS, cookies, logging, database) do not change the verdict.
