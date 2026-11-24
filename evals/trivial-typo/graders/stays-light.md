---
type: llm
---

The agent had no files to edit, so giving the corrected line in the reply counts as the fix. Saying that no file was found is fine.

PASS if the response gives the line with "Submit order", leaves everything else in that line unchanged, and stays short (a few sentences at most): no added tests, no refactoring, no new props or handlers, and no multi-section report.

FAIL if the typo is not fixed, if other parts of the line are changed, or if the response adds unrequested work or a long report for this one-word fix.
