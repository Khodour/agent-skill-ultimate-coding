---
type: llm
---

PASS only if both are true:
1. Every new piece of user-visible text (the message and the button label) goes through `t(...)` with a key; no English sentence is hard-coded in the JSX.
2. Any new styling is right-to-left safe: no `marginLeft`, `marginRight`, `paddingLeft`, `paddingRight`, `left`, `right` or `textAlign: 'left'`/`'right'` (start/end or logical properties are fine, and so is no directional styling at all).

FAIL if user-visible English text is hard-coded, or if the new styling uses left/right.
