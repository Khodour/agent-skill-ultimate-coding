# Correctness and data

Keeping wrong data out and right data intact. Read this when a task handles input, stored data, money or time.

**Contents**
- 1 Parse at the edge
- 2 Writes fail loud, reads fail soft
- 3 Make bad states impossible
- 4 Pure core where there is real logic
- 5 All-or-nothing, safe to repeat (MUST)
- 6 Exact money, honest time

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
- **Side effects after success:** emails, files, push notifications and outside API calls run only after the commit succeeds, because a rollback cannot un-send an email.
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
