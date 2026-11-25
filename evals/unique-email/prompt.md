---
description: "An email can register once: uniqueness must hold against letter case and against two signups at once."
tags: [correctness, data, concurrency]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write `register(email, password)` for our Python app (psycopg 3, Postgres). Each email address may have only one account.

```python
# Table: users(id bigserial primary key, email text not null, password_hash text not null, created_at timestamptz default now())
# hash_password(pw) -> str is provided.
```
