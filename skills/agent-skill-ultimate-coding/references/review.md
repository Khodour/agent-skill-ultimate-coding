# Review and report

Checking the work, then reporting it honestly. Read this at the Verify and Report moments of every normal or complex task, and every change in a risk area.

**Contents**
- Self-review checklist
- Independent review (risk areas and complex tasks)
- Report example

---

## Self-review checklist

Read the **whole diff** as a strict reviewer would, in this order (most important first):

**1. Design**
- [ ] Does the change belong here, or in an existing shared piece?
- [ ] Is it the smallest design that works? Nothing built "for later"?
- [ ] One reason to change per piece; each decision in one place?

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
- [ ] A header on every new file, and on new public or non-obvious classes and functions?
- [ ] Complex parts explain *why*?
- [ ] Every comment and doc touched by the change still true?

**7. Leftovers**
- [ ] No debug prints, commented-out code, silent TODOs, unused imports, temp files.
- [ ] No unrelated changes or reformatting.

Fix what you find and re-run the checks.

---

## Independent review (risk areas and complex tasks)

A change in a risk area (money, auth, permissions, personal data, data migrations, concurrency, public API changes), and every complex task, gets a review from a fresh pair of eyes, qualified for that area.

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

The format and its rules are in SKILL.md (Report). A normal task with something left to check:

````markdown
Invoices can now take a discount code.

| Check | Result |
|---|---|
| build · 14 unit tests | ✅ pass |
| browser test on staging: apply, remove, expired code, code above the total | ✅ pass |
| a code above the total gave −50 | test added, fixed, retested ✅ |

```diff
- PDF export with a discount not checked (no PDF tool here): open a discounted invoice → Export PDF → the discount line should appear
- `invoices/list.py`: search is built by string concatenation (SQL injection); found, not touched
```
- Not committed: 6 files on branch `feature/discount-codes`

**I have medium confidence in this change** 🟡 because the tests and the browser test passed after my last edit, but the PDF export with a discount was not tried.
1. You open a discounted invoice and export the PDF **(recommended)**: then high
2. I fix the injection in `invoices/list.py` as a separate task: any signed-in user can reach it
3. Leave both for now
````

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- Google Engineering Practices: [what to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html), [small changes](https://google.github.io/eng-practices/review/developer/small-cls.html), [handling pushback](https://google.github.io/eng-practices/review/reviewer/pushback.html)
