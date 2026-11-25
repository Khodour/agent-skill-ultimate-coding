---
description: "A scheduled job on several instances must not run the same work twice."
tags: [correctness, concurrency, jobs]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a Node.js job that runs every 5 minutes with node-cron and emails a reminder for each appointment starting within the next hour, then marks it as reminded. Our app runs on 3 instances behind a load balancer, and each instance starts this job.

```js
// Table: appointments(id serial primary key, starts_at timestamptz, email text, reminded_at timestamptz null)
// db.query(sql, params) -> { rows }; mailer.sendReminder(appointment) -> Promise
```
