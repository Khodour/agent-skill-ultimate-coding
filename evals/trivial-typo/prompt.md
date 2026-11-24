---
description: A trivial fix must stay light — no tests, refactors or long report.
tags: [sizing]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

The checkout button in our React app has a typo. Fix it:

```jsx
<button className="btn-primary" onClick={placeOrder}>Sumbit order</button>
```
