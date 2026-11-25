# Security

Rules 1–5 are MUSTs (also listed in `SKILL.md`). Read this file in full when a task touches auth, permissions, secrets, personal data, files, uploads, payments or dependencies.

**Contents**
- 1 Data never becomes code (MUST 1)
- 2 Check access per action and per record (MUST 2)
- 3 Never hand-roll auth or crypto (MUST 3)
- 4 Secrets stay outside the code (MUST 4)
- 5 Never weaken a safety check (MUST 5), with the known-fixes table
- 6 Least privilege, safe defaults
- 7 Safe errors, careful logs
- 8 Limit everything public or expensive
- 9 Few, maintained, pinned dependencies

---

### 1. Data never becomes code (MUST 1)
Input never gets glued into SQL, shell commands, HTML, file paths or templates.

| Destination | Safe way |
|---|---|
| SQL | Parameterized queries or the ORM's parameters |
| Shell | Argument lists (no shell string); never pass input to a shell |
| HTML | The template engine's auto-escaping; encode for HTML, attribute, URL or JS context |
| File paths | Resolve the path, then check it stays inside the allowed folder; never trust `../` |
| Templates | Never render user input as a template |

**Escape for where the data is going, not where it came from.** HTML escaping does not protect SQL, and SQL escaping does not protect HTML.

**When the language manages memory by hand:** check every buffer and array bound.

```text
❌ query("SELECT * FROM users WHERE email = '" + email + "'")
✅ query("SELECT * FROM users WHERE email = ?", [email])

❌ run("convert " + filename + " out.png")
✅ run(["convert", filename, "out.png"])
```

### 2. Check access on the server, for every action and every record (MUST 2)
Deny by default. "Is this user logged in?" is not enough; also ask "**may this user touch this record?**" Never rely on the UI hiding a button.

```text
❌ GET /invoices/:id → return Invoice.find(id)
   (any logged-in user can read any invoice by changing the id)

✅ GET /invoices/:id → invoice = Invoice.find(id)
                       if !user.canView(invoice) → 403
```

### 3. Never hand-roll auth or crypto (MUST 3)
- Use the platform's proven library for login, sessions, tokens and encryption.
- Passwords: a slow, salted hash (bcrypt, scrypt, Argon2). Never MD5, SHA-1 or plain SHA-256 for passwords.
- Tokens: random (from a secure random source), they expire, and they can be revoked (for example on sign-out or password change).
- Compare secrets in constant time (the library's compare function).

```text
❌ token = md5(password + email)       never expires; anyone with the database can compute it
✅ token = library.createSession(user, expiresIn = 1 day)
```

### 4. Secrets stay outside the code (MUST 4)
- Never in source code, git, logs, URLs, error messages, or shipped apps (mobile, desktop, frontend bundles: anything the user can download can be read).
- Load them from environment variables or a secret store. Add secret files to `.gitignore` before the first commit.
- **A leaked secret is rotated, not just deleted:** git history and copies keep it forever.
- Never send secrets, customer data or private code to outside tools (web searches, pastebins, third-party APIs) unless the user explicitly asks.

```text
❌ GET /admin/migrate?key=SECRET          the secret lands in server logs and browser history
✅ an authenticated admin action, or a deploy-time command
```

### 5. Never weaken a safety check to make something work (MUST 5)
If a check blocks you, fix the cause. Follow this order:

1. **Fix the cause yourself.** Most blocked checks have a known safe fix (table below).
2. **If a human decision is truly needed**, ask so a junior can answer: plain words, what each option leads to, the safe option marked recommended, and "if you're unsure, choose the recommended one".
3. **If the user still chooses the unsafe option:** local development only, behind a setting that **defaults to safe**, with a warning comment in the code, and repeated as a `Warning:` line under "Needs attention" in the report.

**Known fixes**

| Error | Wrong fix | Right fix |
|---|---|---|
| SSL or certificate error | Turn off verification | Install the right CA certificate, fix the system clock, or use the correct host name |
| CORS blocked | `Access-Control-Allow-Origin: *` | List the exact allowed origins |
| CSRF check failed | Disable CSRF protection | Send the CSRF token with the request |
| Permission denied on a file | `chmod 777` | Fix the file's owner or group; grant only what is needed |
| Auth blocks the tests | Skip auth in the code | Use a test user or test token in the test setup |
| Database permission denied | Connect as the admin account | Grant the app's account only the permission it needs |
| Content Security Policy blocks a script | Remove the CSP | Add the specific source, or move the inline script to a file |

### 6. Least privilege, safe defaults
- Every account, key, token, container and process gets only the access it needs.
- When a check cannot decide, the answer is **no** (fail closed).
- **When it is a web app:** HTTPS only; cookies are `HttpOnly`, `Secure` and `SameSite`; CSRF protection on cookie-based sessions.

### 7. Safe errors, careful logs
- Users see a simple message. Stack traces, SQL and internal paths stay in the logs.
- Logs **never** contain passwords, tokens, card numbers or personal data in plain form.
- Log security events: logins, failed logins, permission denials, changes to roles and admin settings.

### 8. Limit everything public or expensive
- Rate limits on login, one-time codes, password reset, sign-up, search and anything that costs money (SMS, email, AI calls).
- Uploads: check size and real type (not just the extension), store them under random names, outside any folder that can execute code.
- Timeouts on every outgoing call (see `resilience.md`).

### 9. Few, maintained, pinned dependencies
- Add a library only when it earns its place; a few lines of your own code can beat a new dependency.
- Prefer well-known, maintained packages. **Check that the package name really exists** and is the official one: attackers register names that AI agents tend to invent.
- Commit the lock file. Check for known vulnerabilities with the ecosystem's audit tool.
