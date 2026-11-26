# Observability: logs, metrics and alerts

How running software tells people what it is doing and when it is failing. Read this when a task adds or changes logging, metrics, health checks or alerts, or adds a service, endpoint or background job that runs unattended.

**These are lasting principles, not copies of the standards.** Tools and their APIs change. The truth is, in this order: what the project already uses (its logger, its metrics library, its tracing setup, its alert rules), then the official documentation of those tools as it is today. Never add a monitoring stack the project does not have just to follow this file; use what is there, and suggest the rest in the report.

This file adds to two rules that already exist: what never goes in a log (`security.md`, rule 7) and errors reported with context (`resilience.md`, "See failures before users report them").

**Contents**
- 1 Use the project's own tools
- 2 Logs a machine can read and a person can follow
- 3 Logging never breaks the app
- 4 Measure what users feel
- 5 Alerts a person can act on
- Sources

---

### 1. Use the project's own tools

Before writing a log line or a metric, **search the whole project** for how it logs and measures (a logging helper, `logger`, `log`, a metrics module), not only the file you are in (`SKILL.md`, MUST 14). A file with no logging does not mean the project has no logger. Then do the same: the same logger, the same field names, the same metric naming. A second logging style in one project makes every search and dashboard worse. No `print` or console output in place of the project's logger.

### 2. Logs a machine can read and a person can follow

- **Structured, not sentences:** an event name plus fields (`order_cancel_failed`, `order_id`, `reason`), in the project's format, often JSON. A field can be searched and counted; a sentence cannot.
- **Who, what, when, where:** enough to answer "what happened, to which record, for whom, where in the system" without reading the code. The time comes from the logger, in one time zone.
- **One id across the whole request:** pass the request or trace id the project already uses into every log line and every outgoing call, so one user's problem can be followed across services.
- **Values from users are cleaned before they are logged:** a line break or control character in user input can forge a fake log line (log injection). Use the logger's own fields rather than pasting the value into the message.
- **Levels mean something:** an error is a failure someone may need to act on; a warning is unusual but handled; routine success is info or debug, not error.

### 3. Logging never breaks the app

A failure to log (a full disk, a logging service that is down) must not stop the request or the job. Logging calls never throw into the business code.

### 4. Measure what users feel

When the project has metrics, a new service, endpoint or job gets the ones the project already records for its neighbours. For anything that serves requests, these four cover most failures:
- **Latency:** how long it takes, for successes and failures separately (a fast error is still an error).
- **Traffic:** how much demand there is.
- **Errors:** how many requests fail.
- **Saturation:** how full the most limited resource is (a queue, a pool, a disk).

Report latency as percentiles (for example the 95th and 99th), never only the average: an average hides the slow requests users complain about.

### 5. Alerts a person can act on

- **Alert on symptoms users feel** (errors up, pages slow, a job not finishing), not on every internal cause.
- **Every alert needs a human action.** If the right response is "wait and see", it is a dashboard, not an alert. Noisy alerts teach people to ignore them.
- **Simple rules.** An alert someone cannot understand at three in the morning gets silenced.
- **Unattended jobs say when they did not run.** A nightly job that silently stops is found weeks later; record that it ran and alert when it has not.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Google SRE book: [Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/), [Service level objectives](https://sre.google/sre-book/service-level-objectives/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OpenTelemetry: signals](https://opentelemetry.io/docs/concepts/signals/)
- The Twelve-Factor App: [logs](https://12factor.net/logs)
