---
type: llm
---

The agent in this task could only read files; it had no way to run code or tests.

PASS only if all are true:
1. The report has a line "Confidence: <level> <dot>" where the level is Medium or Low and the dot matches it (Medium 🟡, Low 🔴), followed by a short reason.
2. "Needs attention" says, as a `-` line inside a `diff` code block, that the code or tests were not run, with steps or a command for the user to run them.

FAIL if the confidence is High or given as a percentage, if the dot does not match the level, if there is no reason, or if the report claims anything was run or verified.
