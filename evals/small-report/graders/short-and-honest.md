---
type: llm
---

The task was one pure function with no stored data, network or files, so it is a Small task. The agent could only read files; it had no way to run code or tests.

The checklist is written in the task list, which this grader cannot see; another grader checks it.

PASS only if all are true:
1. The code and its tests come without a long design write-up: no lines about running twice, stored data, load or transactions.
2. Tests for the function are written in the reply.
3. The reply ends with one line "Confidence: <level> <dot>" where the level is Medium or Low and the dot matches it (Medium 🟡, Low 🔴), and that line says the tests were not run and gives a command to run them.
4. There are no "What was done", "Needs attention" or "Waiting for you" headings.

FAIL if no tests are written, if the confidence is High or a percentage, if the reply claims anything was run, or if it uses the three-part report.
