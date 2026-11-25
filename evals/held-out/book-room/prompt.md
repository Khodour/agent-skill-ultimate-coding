---
description: "Held out: booking rules that need the database live outside the handler, and two bookings at once never overlap."
tags: [held-out, design, layering, concurrency]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add `POST /rooms/:id/bookings` so a signed-in member can book a meeting room. A booking lasts 30 to 120 minutes and must fall between 08:00 and 20:00. It may not overlap another booking of the same room, and a member can hold at most 2 future bookings.

```js
// Express + node-postgres. rooms(id, name)
// bookings(id, room_id, member_id, starts_at, ends_at)
// req.user.id is the signed-in member.   pool.query(sql, params) -> { rows, rowCount }
```
