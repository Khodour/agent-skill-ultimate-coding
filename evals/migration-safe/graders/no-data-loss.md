---
type: llm
---

PASS only if all are true:
1. Existing rows are backfilled into `first_name` and `last_name` from `full_name`.
2. `full_name` is NOT dropped in the same migration that adds the new columns: it is kept until the app code no longer reads it (a later step or release), so the running app keeps working during the rollout.
3. The response deals with names that do not split cleanly (a single word, extra spaces, or many parts), or clearly flags them.

FAIL if the migration drops or renames `full_name` in the same step, or if existing data is not copied into the new columns.
