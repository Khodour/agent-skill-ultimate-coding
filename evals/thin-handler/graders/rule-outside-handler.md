---
type: llm
---

PASS only if both are true:
1. The discount rule (the gold tier check, the $100 threshold and the 10% calculation) lives in its own function or module that can be called without `req` or `res`, and the route handler only calls it.
2. The money stays in integer cents, with the rounding of the discount stated or explicit (for example `Math.round`).

FAIL if the tier or threshold logic is written inline inside the route handler, or if the discount is computed in floating-point dollars.
