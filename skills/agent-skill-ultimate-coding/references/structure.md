# Structure, naming and comments

Where code lives, what it is called, and how it explains itself. Read this when a task creates files or folders, names things, or writes comments.

**Contents**
- Structure rules 1–3
- Naming and settings rules 4–5
- Comment rules 6–8

---

## Structure

### 1. Feature first, kind inside
Group code by feature, then by kind inside each feature. Things that change together live together, so one change touches one folder. Code shared by many features goes in a `core/` or `shared/` folder, organised by kind. When the framework requires its own layout, the framework wins.

```text
❌ by kind first: one feature is spread over three trees
   models/invoice
   api/invoice
   views/invoice

✅ by feature first
   invoices/
     model
     api
     views
     tests
   payments/
     ...
   core/
     db/
     http/
```

### 2. A clean root
- **Repo with several projects** (for example `server/`, `client/`, `design/`): the root holds only those parent folders plus repo-wide files (README, LICENSE, CI config, `.gitignore`, agent instructions). Each project keeps its own config, lock file and tests inside its folder.
- **Single project:** follow the ecosystem's standard layout. Files that tools require at the root (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `composer.json`, …) stay there.
- Never a flat pile of files, and never one giant file.

### 3. Size signal
A hand-written file over ~400 lines, or a function over ~50, is a signal to check for more than one job (see `design.md`). It is a signal, not a ban.

---

## Naming and settings

### 4. Names tell the truth
- A name says what the thing is or does. Long enough to be clear, short enough to read.
- **One word per idea.** Don't mix `get`, `fetch` and `load` for the same kind of operation.
- **Booleans read as yes/no questions:** `isActive`, `hasAccess`, `canEdit`.
- **Units in the name:** `timeoutMs`, `sizeBytes`, `priceCents`.
- No unexplained abbreviations (`cfg`, `usr`, `tmp2`), except ones everyone in the field knows (`id`, `url`, `http`).
- **No magic numbers:** give them a named constant.

```text
❌ if (u.st == 3 && d > 86400) ...
✅ if (user.status == SUSPENDED && secondsSinceLogin > ONE_DAY_SECONDS) ...
```

### 5. Settings live outside the code
URLs, limits, feature switches and anything that differs between environments go in config, not hard-coded. Secrets are covered by MUST 4 and `security.md`.

---

## Comments

### 6. Every file, class and function has a header
Say **what it does and why it exists**, in the language's own doc format. One line is enough when it is obvious. Name the caller only when that is not obvious, because caller lists go stale.

```python
def apply_discount(order, code):
    """Apply a promo code to an order, refusing codes that are expired
    or would push the total below zero (finance rule: no negative invoices)."""
```

```go
// ParseAmount turns user text like "12.50" into integer cents,
// so money is never stored as a float.
func ParseAmount(s string) (int64, error) {
```

```javascript
/** Debounced search box: waits 300 ms after typing stops so we send
 *  one request per search, not one per keystroke. */
function SearchBox() {
```

Obvious pieces get one line:

```text
✅ /** Full name for display: "First Last". */
❌ a five-line header on a one-line getter
```

### 7. Explain the *why* of complex code
Complex conditions, queries, calculations, business rules and workarounds get a comment saying **why** they exist. Link workarounds to the bug or issue. Never narrate what the code already says.

```text
❌ i = i + 1   // add one to i

✅ // Banks reject transfers on the last business day after 15:00 local
   // time, so we move them to the next business day (issue #482).
   if isLastBusinessDay(date) && localHour(date) >= 15 { ... }
```

If code needs a comment to explain *what* it does, simplify the code first.

### 8. Comments stay true
- When code changes, its comment changes **in the same edit**. A stale comment is a bug.
- **No commented-out code.** Version control remembers it; delete it.
- **No silent TODOs.** Fix it now, or list it in the report under "Noticed, not touched".
