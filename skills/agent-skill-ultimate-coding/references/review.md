# Review and report

The last two moments: check the work, then report it honestly. Read this at the Verify and Report moments of every normal or complex task.

**Contents**
- Self-review checklist
- Independent review (complex tasks)
- Report example

---

## Self-review checklist

Read the **whole diff** as a strict reviewer would, in this order (most important first):

**1. Design**
- [ ] Does the change belong here, or in an existing shared piece?
- [ ] Is it the smallest design that works? Nothing built "for later"?
- [ ] One job per piece; each decision in one place?

**2. Behaviour**
- [ ] Does it do what "done" said, including edge cases and errors?
- [ ] All MUSTs hold? Pay special attention to input reaching SQL/shell/HTML, access checks per record, secrets, transactions, and anything shipped that could break.
- [ ] Races: what happens with two users, a double click, a retry?
- [ ] Read the removed lines too: did an access check, a raised error or a validation disappear without coming back somewhere else? Repeated edits drop these quietly.

**3. Complexity**
- [ ] Could a new developer understand it in one read?
- [ ] Could it be much shorter and just as clear?

**4. Tests**
- [ ] Do the tests fail when the code is broken?
- [ ] Unhappy paths covered for the risk level?

**5. Naming**
- [ ] Do names tell the truth, with one word per idea?

**6. Comments and docs**
- [ ] Header on every new file, class and function?
- [ ] Complex parts explain *why*?
- [ ] Every comment and doc touched by the change still true?

**7. Leftovers**
- [ ] No debug prints, commented-out code, silent TODOs, unused imports, temp files.
- [ ] No unrelated changes or reformatting.

Fix what you find and re-run the checks.

---

## Independent review (complex tasks)

Complex tasks (money, auth, permissions, personal data, data migrations, concurrency, public API changes) get a review from a fresh pair of eyes.

**If your agent can start a subagent or separate reviewer:**
- Give it **the diff and the files it touches**, and a **narrow job**. Not your conclusions, and not the whole project.
- Tell the user it is running.
- Fix what it finds and re-run the checks. One round; review again only if the fixes were big.

Brief template:

```text
Find bugs in this change. Focus on: <the risk, e.g. "double charging and
race conditions in the payment flow">.
Diff: <diff>
Files touched: <paths>
Report each problem with: file and line, what goes wrong, a concrete
scenario that triggers it. Say "no problems found" if there are none.
```

**If it cannot:** do a second, separate pass. Reread the diff from the top, ignoring your earlier conclusions, and go through the checklist above as if someone else wrote the code.

---

## Report example

The format and its rules are in SKILL.md (Report). A normal task, written out in full:

````markdown
---
### 1. What was done
```diff
+ Invoices can take a discount code
```
- `discounts/`: new model, API and tests
- `invoices/total.py`: `calculate()` applies the discount
- Checks: ✅ build · ✅ 14 unit tests · ✅ browser test on staging (apply, remove, expired code, code above total)
- A code above the total gave −50: added a test, fixed, retested
- Invoice page: 4 queries, unchanged

**Confidence: Medium 🟡** PDF export with a discount was not tried

---
### 2. Needs attention
**This task**
```diff
- PDF export with a discount not verified (no PDF tool locally): open a discounted invoice → Export PDF → the discount line should appear
```
- Not committed: 6 files on branch `feature/discount-codes`

**Found elsewhere, not touched**
```diff
- `invoices/list.py`: search is built by string concatenation (SQL injection)
```

---
### 3. Waiting for you
1. Fix the injection in `invoices/list.py` as a separate task now? Recommended: yes, it is reachable by any signed-in user.
---
````
