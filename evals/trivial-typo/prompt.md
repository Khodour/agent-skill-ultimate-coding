---
description: A trivial fix must stay light — no tests, refactors or long report.
tags: [sizing]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

The checkout button in our React app has a typo. Fix it:

```jsx
<button className="btn-primary" onClick={placeOrder}>Sumbit order</button>
```
