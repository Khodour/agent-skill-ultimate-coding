---
description: Writing a commit message is not a coding task; the coding skill should stay quiet.
tags: [trigger, no-fire]
max_turns: 6
append_system_prompt: "This session has no repository and no files to edit. Answer in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a commit message for this staged change:

```diff
-  if (qty > BULK_MIN_QTY) {
+  if (qty >= BULK_MIN_QTY) {
```

It fixes the bulk discount not applying at exactly 10 items.
