---
type: llm
---

This case tests one thing: using the right identifier in each place when a record has our id and an outside service's id.

PASS only if both are true:
1. `pushStatus` calls Trackly with the task's `trackly_issue_id` (looked up from our row), never with our own task `id`.
2. `handleTracklyWebhook` finds our task by `trackly_issue_id = body.issue_id`, never by `id = body.issue_id`.

FAIL if either function mixes up our id with Trackly's id anywhere. Other qualities (error handling, unlinked tasks, retries) do not change the verdict.
