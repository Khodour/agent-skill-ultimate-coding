---
type: llm
---

Judge only the report at the end of the response (after the code and tests).

PASS only if all are true:
1. It has a heading line starting with `#` that contains "What was done", and after it a heading line starting with `#` that contains "Needs attention".
2. A heading containing "Waiting for you" appears only if the report asks the user a question, and then holds that question as a numbered item.
3. Under "What was done" there is a `diff` code block whose line starts with `+` and states the result.
4. Emoji appear only as status marks (✅, ❌, or one 🟢/🟡/🔴 on the confidence line), never in headings.

FAIL if any of these is missing or wrong, or if the report instead uses the old labels "What changed / Tested / Not verified / Warnings".
