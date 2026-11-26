# Worked examples

Two tasks done end to end: the checklist, the steps, the proof and the report. Read this before your first checklist, and whenever you are unsure how much to write. Copy the shape, not the code: the task, the language and the project will differ.

**Contents**
- A. Normal task: a bug fix (Python)
- B. Complex task: moving points between accounts (Go)

---

## A. Normal task: a bug fix

> "Customers can still find products we deleted. Fix the search."

**Checklist** (one task per item in the task list, before any code; the read-only query needs no Twice or Data item):

```text
1. Build on active_products() in catalog/queries.py, which already filters deleted_at
2. Hide deleted products from search results
3. Edges: no products; every match deleted; a product deleted after it was indexed
4. MUST 1: the query stays parameterized
5. MUST 12: fix search() itself, no filter added after the results come back
6. Proof: a test that search("lamp") skips a deleted lamp fails today
7. Proof: that test passes after the fix, and the full suite passes
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

**Checklist** (with risk items):

```text
1. Build on loyalty/redeem.go: the same transaction helper and error types
2. Move n points from one member's account to another's, all or nothing
3. Edges: n <= 0; sender == receiver; not enough points; unknown receiver; huge n
4. Twice: a retry or double click sends the same requestID → stored once (unique key)
5. Twice: two transfers from one account at once → rows locked, balance re-checked
6. Data: one transaction: debit sender, credit receiver, insert transfer row; 3 statements, no loops
7. MUST 2: the sender must be the signed-in member
8. Risk: two members sending to each other at once can deadlock → lock rows in id order
9. Risk: the way back is a new opposite transfer, never an edit of the old row
10. Proof: tests for success, not enough points, same requestID twice → one transfer
11. Proof: 20 parallel transfers from one account never go below zero
12. Proof: independent review of the diff
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

Longer than A, because a complex task has more to prove. Every risk item on the checklist has an answer in the code, a test, or the report.
