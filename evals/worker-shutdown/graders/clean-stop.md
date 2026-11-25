---
type: llm
---

This case tests one thing: when the platform stops the worker (SIGTERM), the job in progress is not lost.

PASS only if the code handles SIGTERM (and ideally SIGINT) by stopping the loop from taking new jobs and either letting the current job finish before exiting or putting it back on the list.

FAIL if a stop signal can kill the process mid-job with the job already removed from Redis and not finished or returned. Other qualities do not change the verdict.
