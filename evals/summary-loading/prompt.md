---
description: "DAPLab pattern 9: a failed call must end the loading state and tell the user, not leave a spinner."
tags: [daplab, correctness, ui, errors]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a React component `SummaryPanel({ docId })` for our notes app. It has a "Summarize" button. When clicked, it calls `api.summarize(docId)`, shows "Generating…" while waiting, and then shows the summary text.

```ts
// api.summarize(docId: string): Promise<{ summary: string }>   (calls our AI backend; can be slow)
```
