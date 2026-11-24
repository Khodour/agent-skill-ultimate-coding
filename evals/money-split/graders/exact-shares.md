---
type: llm
---

PASS only if all are true:
1. The money math is exact: it works in integer cents (or a decimal library), not by adding, multiplying and dividing binary floating-point dollar values for the final amounts.
2. The shares always add up exactly to the total: when the total does not divide evenly, the leftover cents are assigned to some people by a clear rule (for example 100.00 / 3 → 33.34, 33.33, 33.33).
3. It rejects invalid input such as zero or negative `people`.

FAIL if it returns equal float shares that can fail to add up to the total, or rounds every share the same way so cents are lost or invented.
