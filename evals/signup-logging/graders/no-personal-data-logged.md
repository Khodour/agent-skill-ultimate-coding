---
type: llm
---

This case tests one thing: the new logging must not write secrets or personal data in plain form.

PASS only if both are true:
1. No log call writes the password, the session token, or the whole `req.body` / request object.
2. No log call writes the email, phone number or full name in plain form, directly or through a raw error object or raw error message that the answer itself says may echo those values. Masked or hashed forms (`j***@example.com`, a hash, only the email's domain), presence flags (`hasPhone`), the user id, a request id, error names and codes, and error text that is scrubbed of emails and phone numbers are all fine.

FAIL if any log call can write the password, token, whole body, or a plain email, phone or full name. Other qualities (how useful the logs are, request ids, log levels) do not change the verdict.
