---
description: "Two people editing the same record: a stale save must not silently overwrite a newer one."
tags: [correctness, concurrency, api]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add `PUT /notes/:id` to our Express API so team members can edit a note's title and body. Several people often have the same note open at once.

```js
// Table: notes(id serial primary key, title text, body text, updated_at timestamptz)
// db.query(sql, params) -> { rows, rowCount }
```
