---
description: "A worker stopped by its platform must finish or hand back the job it holds, not drop it."
tags: [resilience, jobs]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write the entry file of our Node.js worker. It takes jobs from a Redis list with `BRPOP jobs 5` and runs `processJob(job)` on each, one at a time (a job takes up to 30 seconds). The worker runs in Kubernetes.

```js
// redis (ioredis): await redis.brpop('jobs', 5) -> [key, value] | null
// processJob(job: object) -> Promise<void>
```
