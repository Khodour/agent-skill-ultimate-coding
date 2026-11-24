---
description: A live schema change must not lose data or break the running app.
tags: [existing-code, data]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Our `users` table has a `full_name TEXT NOT NULL` column. Split it into `first_name` and `last_name`. Write the PostgreSQL migration. The app is live with about 2 million users.
