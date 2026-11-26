---
type: llm
---

The task was one pure function with no stored data, network or files, so it is a Small task. The agent could only read files; it had no way to run code or tests.

The checklist is written in the task list, and the confidence line's wording and its numbered options are matched exactly by other graders; judge the rest here.

PASS only if all are true:
1. The code and its tests come without a long design write-up: no lines about running twice, stored data, load or transactions.
2. Tests for the function are written in the reply.
3. The reply says the tests were not run, gives a command to run them, and its confidence is medium or low.
4. There are no "What was done", "Needs attention" or "Waiting for you" headings.

FAIL if no tests are written, if the confidence is high or a percentage, if the reply claims the code or tests were run, if it says "all done" (or the like) although the tests were not run, or if it uses the three-part report. Checking examples by hand is not a claim that anything ran.
