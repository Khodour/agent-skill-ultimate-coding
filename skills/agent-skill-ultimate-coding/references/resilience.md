# Resilience

Software meets slow networks, failing servers, impatient users and blocked regions. These rules make it fail gently and recover by itself. Read this when a task calls anything outside the process, or has a UI.

**Contents**
- 1 Every outside call has a time limit
- 2 Retry safely
- 3 Shared concerns live in one place
- 4 Fail gently
- 5 Decide the offline behaviour
- 6 Handle real-life timing
- 7 Bend, don't break
- 8 See failures before users do
- Backups

---

### 1. Every outside call has a time limit
Network requests, database queries, outside services, other processes, locks: nothing waits forever. Pick a limit that fits the call (a search: a few seconds; a report export: longer, in the background).

### 2. Retry safely
- Retry only **temporary** failures: timeouts, connection resets, server errors (5xx), 408 (request timeout) and 429 (too many requests, waiting as long as its `Retry-After` header asks).
- **Never** retry the other client errors (400, 401, 403, 404, 422 and the like): they will fail again. Google Cloud's retry strategy lists 408, 429 and 5xx as the codes worth retrying.
- Wait longer between tries (exponential backoff), add a little randomness (jitter), and **cap the number of tries**.
- **Only retry actions that are safe to repeat** (see MUST 6: idempotency keys for create, charge and send).

```text
❌ while (!ok) ok = send()                     retry storm; double charges
✅ retry(send, attempts = 3, backoff = 0.5s → 1s → 2s, plus jitter,
         only on timeout/408/429/5xx, with idempotencyKey)
```

### 3. Shared concerns live in one place
Timeouts, retries, refreshing the login, connectivity checks and turning errors into user messages live in the **shared API client or middleware**, never copied into each screen or endpoint. One fix then fixes everything.

### 4. Fail gently
- The user sees a clear message in their language, and what to do next ("No connection. Your changes are saved and will send when you're back online.").
- **Never lose what the user typed.** Keep form input after an error.
- If one part of a page fails, the rest still works (see `correctness.md`: reads fail soft).

### 5. Decide the offline behaviour for every user action
Each action is one of:

| Behaviour | Example |
|---|---|
| **Works offline** | Reading cached articles |
| **Queued, sent later** | Sending a message, saving a draft |
| **Blocked with a clear message** | Paying, which needs the server now |

Never a spinner that spins forever. When the connection returns, **pages refill and queued actions send by themselves.**

### 6. Handle real-life timing
- A response that arrives **after sign-out or after switching user** → discard it.
- The screen closed before the answer came → cancel or ignore the request.
- **Out-of-order answers** (typing in a search box) → the latest request wins; drop older responses.
- A login token that expires mid-request → refresh once in the shared client, then retry the request.

### 7. Bend, don't break, when a helper service is down
Optional features (analytics, maps, recommendations, push, chat widgets) fail quietly without blocking the main flow. Login and checkout never fail because analytics is down. If a service keeps failing, stop calling it for a while (a circuit breaker), then try again.

### 8. See failures before users report them
- Errors are logged with context: what was attempted, a request ID, the version. Never secrets or personal data (`security.md` rule 7).
- Errors and crashes go to an error tracker or alerting.
- Key services expose a health check.

---

## Backups

**When stored data matters:** backups exist, and a restore has actually been tested. A backup that has never been restored is a hope, not a backup.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Google SRE book: [addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/), [data integrity](https://sre.google/sre-book/data-integrity/); Google Cloud: [retry strategy](https://docs.cloud.google.com/storage/docs/retry-strategy)
- AWS Builders' Library: [timeouts, retries and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter); Martin Fowler: [Circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- web.dev: [offline UX design guidelines](https://web.dev/articles/offline-ux-design-guidelines); React: [useEffect and race conditions](https://react.dev/reference/react/useEffect); Kubernetes: [probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/); OWASP: [Logging cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
