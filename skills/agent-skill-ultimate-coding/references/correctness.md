# Correctness and data

Keeping wrong data out and right data intact. Read this when a task handles input, stored data, money or time.

**Contents**
- 1 Parse at the edge
- 2 Writes fail loud, reads fail soft
- 3 Make bad states impossible
- 4 Pure core where there is real logic
- 5 All-or-nothing, safe to repeat (MUST)
- 6 Exact money, honest time
- 7 One error model

---

### 1. Parse at the edge
Raw input (from users, files, networks, other programs) becomes checked, well-shaped values **once**, where it enters. Use the project's existing validation tool; if there is none, write one parse function per input. Inner code trusts the result. Business rules ("does this product exist?", "is there enough stock?") are still checked inside.

```text
❌ deep inside the code:   qty = int(request["qty"])   (repeated in 30 places)

✅ at the entry point:
   order = parseOrderInput(request)     returns a typed OrderInput or an error
   placeOrder(order)                    trusts order.qty is a positive integer
```

### 2. Writes fail loud, reads fail soft

**When accepting input or changing state:**

| Field | Result |
|---|---|
| Required and missing | Error |
| Optional and missing | Default value |
| Present but invalid | Error, never a silent fix |

Report the error in the language's normal way (exception, error value, `Result`).

```text
❌ items = parseJson(form.items) or []    a broken request creates an empty order
✅ items = parseJson(form.items)          invalid JSON → "Items are invalid" error
```

**When reading or displaying:** one bad record must not break the whole page. Skip it or mark it, log it, and show the rest.

### 3. Make bad states impossible
- Use the language's strongest tool (types, enums, constants, a constructor that refuses bad values) instead of magic values like `0` = none or `""` = unknown.
- **Derive** live values instead of storing two values that can disagree.
- **Snapshot** historical facts that must not change later: the price paid, the tax rate used, the shipping address the parcel went to.
- **When there is a database:** enforce key rules there too (NOT NULL, UNIQUE, foreign keys, CHECK), because scripts, imports and other apps bypass code checks.

```text
❌ order.isRecurring = true; order.intervalDays = 0      can disagree
✅ order.intervalDays = 30;  isRecurring = intervalDays > 0   derived

❌ invoice line stores productId only; the total changes when the price changes
✅ invoice line stores productId + unitPricePaid + taxRateUsed
```

**When something has a status** (an order, a ticket, a payment, a subscription), it is a state machine. Write it as one:

- **One table of allowed moves**, and **one function** that changes the status. Any other move is an error, never a silent change.
- **Race-safe:** the move checks the old status in the same statement, so two requests cannot both move it.
- **When the history matters**, record each move with its time (and who made it).

```text
❌ if order.status == "paid" or order.status == "packed": order.status = "shipped"
   (the same check copied into five files, each slightly different)

✅ MOVES = { pending: [paid, cancelled], paid: [packed, refunded],
             packed: [shipped], shipped: [delivered] }
   move(order, to):  if to not in MOVES[order.status] → error "cannot go from X to Y"
                     UPDATE orders SET status = :to WHERE id = :id AND status = :from
                     zero rows → someone else moved it first → reload and report
```

### 4. Pure core where there is real logic
**When code holds real rules** (pricing, tax, scoring, permissions, physics, parsing), write them as functions with no input/output: no database, network, files or clock. They can then be tested alone. Plain glue code (load → save) stays simple; don't add layers with nothing in them.

```text
❌ calculateTotal() reads the cart from the database, fetches the tax rate
   over HTTP, and writes the result

✅ total = calculateTotal(items, taxRate, discount)     pure, easy to test
   the shell loads the inputs, calls it, saves the result
```

### 5. All-or-nothing, safe to repeat (MUST)
**When a change touches stored state** (database, files, outside systems):

- **One transaction** for multi-step changes: all of it happens or none of it does.
- **Shared counters** (stock, balance, seats, quotas) use a lock or an atomic update, never check-then-write.
- **Side effects after success:** emails, files, push notifications and outside API calls run only after the commit succeeds, because a rollback cannot un-send an email. Decide per side effect:
  - **Nice to have** (a welcome email): send after the commit; if it fails, log it.
  - **Must happen** (a payment webhook, a stock sync, an invoice email): write a job or "outbox" row **in the same transaction** as the change, and let a worker send it with retries. The receiver handles duplicates, because a retry can deliver twice. Use the project's existing job system; don't add a queue for nice-to-have work.
- **Safe to repeat:** actions that create, charge or send accept an idempotency key or a unique request ID, so a double click or an automatic retry does not run twice.

```text
❌ stock = SELECT stock FROM variant WHERE id = 7
   if stock >= qty: UPDATE variant SET stock = stock - qty WHERE id = 7
   (two buyers both pass the check → overselling)

✅ UPDATE variant SET stock = stock - :qty
   WHERE id = 7 AND stock >= :qty
   if rowsAffected == 0 → "Out of stock"

❌ deleteRecord(); deleteChildren(); deleteFiles()     three separate steps
✅ transaction { deleteChildren(); deleteRecord() }; then deleteFiles()

❌ POST /payments  {amount}                       retried → charged twice
✅ POST /payments  {amount, idempotencyKey}       retried → same payment returned
```

### 6. Exact money, honest time

**When handling money:**
- Never use binary floating point. Use integer minor units (cents) or a decimal type.
- Store the currency with every amount.
- Round in **one** place, with one rule.
- **When an amount is split, the parts add up exactly to the whole.** Return each part, with the leftover cents assigned by one stated rule. If the request asks for a single "per person" amount and the total does not divide evenly, say so rather than silently losing or inventing cents.

```text
❌ total = 0.1 + 0.2              0.30000000000000004
✅ totalCents = 10 + 20           30
✅ split 100.00 three ways → 33.34 + 33.33 + 33.33, the remainder assigned by one rule
```

**When handling time:**

| Kind of value | Store as |
|---|---|
| A moment that happened (created, paid, logged in) | UTC timestamp; convert only for display |
| A plain date (birthday, due date, holiday) | Date only, no time and no zone |
| A future local event ("9:00 in Beirut next March") | Local date-time + time-zone name, because daylight-saving rules can change |

### 7. One error model
If the project already has an error model, use it. Otherwise:

- **Expected errors** (not found, not allowed, invalid input, conflict) are typed: an error class, error value or code. The edge turns them into a response **in one place**: an HTTP status, a message in the user's language, an exit code.
- **Unexpected errors** (bugs, broken invariants, a dependency down) fail loudly up to one top-level handler, which logs them with a request ID and shows a generic message.
- Never decide by matching an error's message text. Never return `null` or `false` to mean three different failures.
- **Assertions** guard your own assumptions (an invariant that "cannot" break). They are not input checks: input is parsed at the edge (rule 1).
- **When code exposes an API:** errors, lists (pagination) and dates (ISO 8601, UTC) have one shape across every endpoint. The contract (a schema, types or a spec) is written once, and a test checks real responses against it. Version only on a breaking change (`existing-code.md` rule 4).

```text
❌ getUser() returns null for "not found", "no permission" and "database down"
✅ getUser() returns the user, or raises NotFound / Forbidden;
   "database down" is unexpected and reaches the top-level handler
   one edge mapping: NotFound → 404, Forbidden → 403, anything else → 500 + request ID
```
