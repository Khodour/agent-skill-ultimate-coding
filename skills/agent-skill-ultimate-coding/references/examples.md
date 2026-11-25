# Worked examples

Two tasks done end to end: the design card, the steps, the proof and the report. Read this before your first design card, and whenever you are unsure how much to write. Copy the shape, not the code: the task, the language and the project will differ.

**Contents**
- A. Normal task: a bug fix (Python)
- B. Complex task: moving points between accounts (Go)

---

## A. Normal task: a bug fix

> "Customers can still find products we deleted. Fix the search."

**Design card** (written in the reply, before any code):

```text
Job        Hide deleted products from search results.
Mirror     catalog/queries.py: active_products() already filters deleted_at
Edges      no products; every match deleted; a product deleted after it was indexed
Twice?     n/a: a read-only query
Data       reads products; writes nothing
Load       one query per search, unchanged; deleted_at is already indexed
MUSTs      1 (query stays parameterized), 9, 12
Done when  a new test shows a deleted product missing from search("lamp"); full suite passes
```

**Step 1: reproduce.** A test that fails today:

```python
def test_search_hides_deleted_products(db):
    """Deleted products must never appear in search (bug: customers found them)."""
    make_product(db, name="Desk lamp", deleted_at=NOW)
    assert search(db, "lamp") == []
```

Run it: `1 failed: assert [<Product Desk lamp>] == []`. The bug is real and the test can catch it.

**Step 2: fix the cause.** `search()` queried the products table directly. It now starts from the existing helper, so "what counts as active" stays decided in one place:

```python
def search(db, text):
    """Products whose name matches the text, newest first. Deleted ones never match."""
    return active_products(db).filter(name__icontains=text).order_by("-created_at")
```

**Step 3: prove it.** The new test passes; the full suite passes (`212 passed`); on the local site, searching for a deleted product returns nothing.

**Report:**

````markdown
---
### 1. What was done
```diff
+ Deleted products no longer appear in search
```
- `catalog/search.py`: `search()` starts from `active_products()`
- Checks: ✅ new test (failed before the fix, passes after) · ✅ full suite 212 passed · ✅ searched on the local site

**Confidence: High 🟢** every check ran, and the real search was tried

---
### 2. Needs attention
Nothing needs attention.
---
````

Short, because the task was small. No restating the request, no generic advice.

---

## B. Complex task: moving points between accounts

> "Let members send loyalty points to another member."

Complex: it moves value between people, two requests can race, and a retry must not send twice.

**Design card** (with Risks):

```text
Job        Move n points from one member's account to another's, all or nothing.
Mirror     loyalty/redeem.go: same transaction helper and error types
Edges      n <= 0; sender == receiver; not enough points; unknown receiver; huge n
Twice?     a retry or double click sends the same requestID → stored once (unique key);
           two transfers from one account at once → rows locked, balance re-checked
Data       one transaction: debit sender, credit receiver, insert transfer row
Load       3 statements per transfer; no loops
MUSTs      1, 2 (the sender must be the signed-in member), 6, 9
Done when  tests: success; not enough points; same requestID twice → one transfer;
           20 parallel transfers from one account never go below zero
Risks      deadlock if two members send to each other at once → lock rows in id order;
           way back: a transfer row can be reversed by a new opposite transfer
```

**Code:**

```go
// Transfer moves points between two accounts in one transaction. It is safe to
// repeat: the same requestID is stored once, so a retry cannot send twice.
func Transfer(ctx context.Context, db *sql.DB, requestID string, from, to, points int64) error {
	if points <= 0 || from == to {
		return ErrInvalidTransfer
	}
	return withTx(ctx, db, func(tx *sql.Tx) error {
		// The unique key on request_id makes a repeated request a no-op.
		res, err := tx.ExecContext(ctx,
			`INSERT INTO transfers (request_id, from_id, to_id, points) VALUES ($1, $2, $3, $4)
			 ON CONFLICT (request_id) DO NOTHING`, requestID, from, to, points)
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return nil // already done by an earlier attempt
		}
		// Lock both rows in id order, so two opposite transfers cannot deadlock.
		if _, err := tx.ExecContext(ctx,
			`SELECT id FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE`, from, to); err != nil {
			return err
		}
		// Conditional debit: the balance check and the change are one statement.
		res, err = tx.ExecContext(ctx,
			`UPDATE accounts SET points = points - $1 WHERE id = $2 AND points >= $1`, points, from)
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return ErrNotEnoughPoints // the whole transaction rolls back
		}
		res, err = tx.ExecContext(ctx, `UPDATE accounts SET points = points + $1 WHERE id = $2`, points, to)
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return ErrUnknownAccount
		}
		return nil
	})
}
```

The handler checks that `from` is the signed-in member before calling `Transfer` (MUST 2).

**Report:**

````markdown
---
### 1. What was done
```diff
+ Members can transfer points to each other, safely under retries and parallel requests
```
- `loyalty/transfer.go`: `Transfer` in one transaction: idempotent insert, rows locked in id order, conditional debit, credit
- `loyalty/handler.go`: `POST /loyalty/transfers`, checks the sender is the signed-in member
- Checks: ✅ 7 unit tests (limits, same account, not enough points, unknown receiver) · ✅ same requestID 3 times → 1 transfer · ✅ 20 parallel transfers of 10 from 100 points → 10 succeed, final balance 0
- Independent review found a missing sender check in the handler: fixed, retested
- 3 statements per transfer, all by primary key

**Confidence: Medium 🟡** not tried at production data size

---
### 2. Needs attention
**This task**
```diff
- Load at production database size not verified: run the parallel test on staging
```
- Not committed: 4 files on branch `feature/point-transfers`
---
````

Longer than A, because a complex task has more to prove. Every Risk in the card has an answer in the code, a test, or the report.
