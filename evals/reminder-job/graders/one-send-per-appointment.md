---
type: llm
---

This case tests one thing: with 3 instances running the job at the same time, each appointment gets one reminder, not up to three.

PASS only if the code makes the claim atomic across instances: for example an `UPDATE ... SET reminded_at = now() WHERE id = ... AND reminded_at IS NULL RETURNING ...` before sending, `SELECT ... FOR UPDATE SKIP LOCKED` inside a transaction, a database advisory lock, or a single elected runner.

FAIL if two instances can both select the same unreminded appointment and both send. Other qualities do not change the verdict.
