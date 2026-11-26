# Performance and caching

Fast by design, proven by measurement. Read this when a task adds a query, a network call, a loop over data, or a cache.

**Contents**
- 1 Ask the load questions
- 2 No input/output inside loops
- 3 Fetch only what is needed
- 4 Index what you search
- 5 One call per moment
- 6 Cache with evidence and a plan
- 7 Slow work goes to the background
- 8 Never block the shared thread
- 9 Release what you take
- 10 Measure, then optimize
- 11 Stress test by risk
- Platform notes

---

### 1. Ask the load questions every time
For every query, call or loop, at design time (it costs nothing):
- How often does this run? Once per request, per item, per keystroke?
- How much data does it touch?
- Does it grow with users, rows or time?

```text
❌ every request writes lastSeen = now() for the logged-in user
   → one database write per page view, for every user
✅ write lastSeen only if it is older than 5 minutes
```

### 2. No input/output inside loops
Never run a query, network call or file read once per item. Fetch everything in one go: a join, `IN (...)`, or a batch call. When you change a function that already does this, fix it in the same change instead of extending it.

```text
❌ orders = getOrders()
   for o in orders: o.customer = getCustomer(o.customerId)   1 + N queries

✅ orders = getOrders()
   customers = getCustomers(ids of orders)                   2 queries
```

### 3. Fetch only what is needed
- Only the columns and rows you use.
- **Long lists are paged**, and loaded only on their own screen, never as a side effect of another one.
- Filter, sort and count **in the database**, not in app memory.

### 4. When there is a database: index what you search
Every new filter, sort or join gets a check that an index supports it. On large tables, read the query plan. A query that is fast on a small table can be slow on a large one.

### 5. When code calls over a network: one call per moment
- Data a screen needs at startup rides on a call that already happens then (a bootstrap or check-in call). **No new request per widget.**
- Merge identical calls made at the same time into one.
- Don't re-fetch on every resume or focus; refresh when the data can actually have changed.
- Send only what changed (tokens, settings, profiles): once per session, or when the value changes.

### 6. Cache with evidence and a plan
Add a cache only when measuring shows a need. Before adding one, decide:

| Question | Example answer |
|---|---|
| Key | `currencies:v1` |
| Lifetime | 1 hour |
| Who clears it, and when | The "update currency" action deletes the key |
| Size limit | 1,000 entries, least-recently-used evicted |

**Never cache:**
- One user's private data in a cache shared between users
- Permission or access decisions
- Balances or stock used to make money decisions
- Secrets

### 7. Slow work goes to the background
Emails, PDFs, image and video processing, imports, exports and reports run as background jobs. The request answers fast and shows progress or a "we'll notify you" state.

### 8. Never block the shared thread
No slow input/output or heavy computation on the thread everything shares:

| Platform | Shared thread |
|---|---|
| Mobile and desktop apps | The UI main thread |
| Node.js, async Python, other async servers | The event loop: no synchronous database, file or network calls inside async code |
| Games | The game loop / frame |

Move the work to a worker, a background thread, or a truly async API.

### 9. Release what you take
Close connections, files and streams (use the language's `finally`, `defer`, `using`, `with`). Remove listeners, timers and subscriptions when the screen or object goes away. Give caches and queues a maximum size. Memory leaks are a slow death for both servers and mobile apps.

### 10. Measure, then optimize
Find the real slow point with a profiler, a query log or a request count, not by guessing. Report the numbers before and after the change.

### 11. Stress test by risk
**When the software has users or clients:**

| Change | Check |
|---|---|
| Any task touching data | Count the queries or requests per action; more than expected → fix it |
| Data paths (lists, search, writes) | **Twice test:** run the write twice and check nothing doubles. |
| Data paths that touch money, stock or shared counters, or a hot path | **Big-data test:** fill with a large dataset and check speed. **Concurrency test:** send a burst of requests at the same item at once and look for races, double charges and overselling. |
| Hot paths (login, checkout, search, the main list) or before a launch or big release | **Real stress test** on staging: ramp up past the expected peak until a component fails (AWS Well-Architected); measure response time (p95), error rate, database connections, memory; find the breaking point. |

**The target:** use the number in the project's rules. If there is none, ask the user how many users the busiest time brings, and test past it until something breaks.

**Safety (MUST 13):** stress tests run only on local or staging, never on production without explicit approval. Replace outside services (payments, SMS, email) with fakes during the test.

---

## Platform notes

- **Servers:** watch database connections, queries per request and response size first.
- **Mobile:** watch startup requests, battery (polling, location), memory, and work on the main thread.
- **Frontend web:** watch bundle size, the number of requests on load, and re-renders.
- **Embedded and games:** watch memory allocation inside loops or frames, and fixed time budgets.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Django: [database access optimization](https://docs.djangoproject.com/en/5.1/topics/db/optimization/); PostgreSQL: [using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html); Google API design: [pagination, AIP-158](https://google.aip.dev/158)
- Node.js: [don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop); Android: [ANRs](https://developer.android.com/topic/performance/vitals/anr); Rails: [Active Job](https://guides.rubyonrails.org/active_job_basics.html); React: [useEffect cleanup](https://react.dev/reference/react/useEffect)
- [CWE-524: sensitive information in a cache](https://cwe.mitre.org/data/definitions/524.html); AWS Well-Architected: [load testing](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel07-bp04.html)
