---
description: "DAPLab pattern 4: a record with our id and an outside service's id must use the right one in each place."
tags: [daplab, correctness, data, integration]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

We keep our tasks in Postgres and mirror them into Trackly, an outside issue tracker. Write two Node.js (TypeScript) functions:

1. `pushStatus(taskId, status)`: change a task's status in our database and in Trackly.
2. `handleTracklyWebhook(body)`: Trackly calls this when someone changes an issue's status there; update our task to match.

```ts
// Our table: tasks(id uuid primary key, title text, status text, trackly_issue_id text null, updated_at timestamptz)
// db.query(sql, params) → { rows }
// Trackly API: PATCH https://api.trackly.example/v2/issues/{issueId}  body { status }  (header Authorization: Bearer <token>)
// Trackly webhook body: { "issue_id": "TRK-4821", "status": "done", "changed_at": "2026-11-25T10:00:00Z" }
```
