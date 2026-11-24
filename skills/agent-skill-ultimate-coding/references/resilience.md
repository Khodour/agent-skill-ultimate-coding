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
- 8 No single-region dependencies
- 9 See failures before users do
- Backups

---

### 1. Every outside call has a time limit
Network requests, database queries, outside services, other processes, locks: nothing waits forever. Pick a limit that fits the call (a search: a few seconds; a report export: longer, in the background).

### 2. Retry safely
- Retry only **temporary** failures: timeouts, connection resets, server errors (5xx), "too many requests" (429).
- **Never** retry "invalid input" or "not allowed" errors (4xx); they will fail again.
- Wait longer between tries (exponential backoff), add a little randomness (jitter), and **cap the number of tries**.
- **Only retry actions that are safe to repeat** (see MUST 6: idempotency keys for create, charge and send).

```text
❌ while (!ok) ok = send()                     retry storm; double charges
✅ retry(send, attempts = 3, backoff = 0.5s → 1s → 2s, plus jitter,
         only on timeout/5xx/429, with idempotencyKey)
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

### 8. When users are in many countries: no single-region dependencies
Core features must not depend on services blocked in some regions (for example Google services in mainland China) or commonly blocked by company firewalls. Have a fallback: an alternative provider, or a degraded but working mode. Check sign-in, push notifications, maps, captchas and fonts.

### 9. See failures before users report them
- Errors are logged with context: what was attempted, a request ID, the version. Never secrets or personal data (`security.md` rule 7).
- Errors and crashes go to an error tracker or alerting.
- Key services expose a health check.

---

## Backups

**When stored data matters:** backups exist, and a restore has actually been tested. A backup that has never been restored is a hope, not a backup.
