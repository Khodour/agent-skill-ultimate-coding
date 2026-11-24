# Testing and verification

How to prove the work, not just claim it. Read this when writing or changing tests, and before finishing any normal or complex task.

**Contents**
- When to add tests
- Rules 1–11
- The human-error checklist
- Example real-user test report

---

## When to add tests

| Change | Tests |
|---|---|
| Bug fix | **Always.** Reproduce the bug with a failing test first. |
| Real logic: money, rules, permissions, calculations, parsing | **Always.** |
| Trivial: text, styling, renames, one config value | **Never.** Run the existing checks only. |
| Everything else | **Suggest** tests in the report; add them if the project already tests similar code. |

---

## Rules

### 1. Prove it, don't claim it (MUST)
Never say done or fixed without running something that shows it: tests, the app, or a script that reproduces the problem. If you could not run it, say so plainly and give the user the steps to check it.

### 2. Bugs: reproduce first
Write a test or script that **fails** because of the bug. Fix the code. Watch it pass. Without the failing step, you don't know the fix fixed anything. If you cannot run tests, still write the reproducing test into the change (or into the reply when there are no files) and mark it not run: the user can run it, an unwritten test helps no one.

### 3. Never weaken a test to make it pass (MUST)
Don't edit, skip or delete a test just to turn it green. If the test itself is wrong, say why before changing it. A test must be **able to fail**:

```text
❌ assert true
❌ a test that only checks the mock you just configured
❌ expected value copied from the current (possibly wrong) output
✅ expected value worked out independently from the requirement
```

### 4. Test behaviour, not internals
Test through what the code does from the outside: inputs to outputs, user actions to results. Restructuring the inside should not break the tests.

### 5. Reliable tests
Fast, independent of each other, and the same result on every run. Control what changes between runs: use a fake clock, a fixed random seed, and no real network calls. A flaky test teaches everyone to ignore red.

### 6. Test where the bugs live
- Real logic → many fast, focused tests.
- The joints (database, APIs, files, queues) → a few integration tests.
- The key user journeys → a very small number of end-to-end tests.

For apps that are mostly create-read-update-delete screens, integration tests usually catch more than unit tests. Put effort where the risk is.

### 7. Test the unhappy paths
Empty, invalid, too big, duplicate, no permission, slow or offline, two users at once. Use the checklist below.

### 8. Fit the project
Use the project's existing test framework, folders and style. **If there are no tests:** don't build a big framework unasked. Add the smallest useful test or check script and suggest more in the report.

### 9. Run every check the project already has
Build, type checker, linter, formatter, tests. **When the change is visual:** look at it (screenshot or real screen). **When you claim it is faster or uses fewer requests:** measure before and after, and report the numbers.

### 10. Review your own diff
Before saying done, follow `review.md`: read the whole diff as a reviewer would, remove leftovers, and get an independent review for complex work.

### 11. Finish with a real-user test
**When a task changes something a user can do** (a feature, a flow, a calculation):

1. **Use the real interface** on a **safe environment** (local, dev or staging, with test accounts):

   | Software | Interface |
   |---|---|
   | Website | A browser, through browser automation if available |
   | Mobile app | Simulator or emulator |
   | Command-line tool | The terminal |
   | API | Real HTTP calls |
   | Library | Its public functions |

2. **Never on production.** No real payments, emails or SMS: use test modes or fakes. Clean up test data afterwards.
3. **Happy path first, then act like a careless or confused human** (checklist below).
4. **Check results against expected values worked out separately**, by hand or with an independent calculation. A number appearing on screen does not mean it is right.
5. **Every bug found becomes an automated test**, then gets fixed and retested.
6. **Report** what was tested with ✅/❌ (example at the end).

**Scope:** every feature the task touched, plus the features that share code with it. Sweep the whole app only for big tasks or before a release.

**If the tool is missing** (no browser automation, no emulator): test at the API or function level, give the user a short manual checklist, and list what was not tested by hand under "Not verified".

---

## The human-error checklist

**Every kind of software**
- Empty, very long, wrong format, leading/trailing spaces, pasted text with line breaks
- Zero, negative, decimal, very large numbers
- Non-Latin text (Arabic, Chinese), emoji, mixed directions
- Steps done out of order, or abandoned halfway
- Wrong permissions (log in as the lowest role), session expired mid-action
- Slow network, offline, server error, timeout

**When there is a UI**
- Double-click on Submit, Back button, refresh during a save, two tabs open
- Right-to-left layout, small screens, large system font size
- Keyboard only (Tab, Enter, Escape)

**When there is money**
- Totals add up: line items equal the total; debits equal credits
- Rounding: 0.1 + 0.2, splitting 100 into 3
- Discounts bigger than the total, negative totals
- Refunds: partial, full, refunding twice
- Several currencies, an exchange rate changing mid-flow
- Date edges: month end, leap day, time zones, daylight-saving change
- The same payment submitted twice is charged once

---

## Example real-user test report

| Test | Expected (worked out separately) | Got | Result |
|---|---|---|---|
| Invoice: 3 lines + 11% tax | 1,248.75 | 1,248.75 | ✅ |
| Discount larger than the total | Error "Discount exceeds total" | Total became −50 | ❌ → test added, fixed, retested ✅ |
| Double-click "Pay" | One payment | Two payments | ❌ → idempotency key added, retested ✅ |
| Lowest role opens another branch's invoice | 403 denied | Denied | ✅ |
| Arabic client name in the PDF | Correct right-to-left text | Correct | ✅ |
