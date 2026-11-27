---
description: Rules that need the database (limits, availability) and their transaction live in a service function, not in the route handler.
tags: [design, layering, service, rule-business-rules, rule-must-6, ref-design]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add `POST /loans` so a signed-in library member can borrow a book. A member can have at most 3 active loans, a book can be lent to only one member at a time, and members with unpaid fines can't borrow.

```js
// Express + node-postgres. members(id, fines_cents)   books(id, title)
// loans(id, member_id, book_id, borrowed_at, returned_at NULL while active)
// req.user.id is the signed-in member.   pool.query(sql, params) -> { rows, rowCount }
```
