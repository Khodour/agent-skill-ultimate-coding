---
description: Summarising a meeting is not a coding task, even when the meeting is about software.
tags: [trigger, no-fire, rule-trigger]
max_turns: 6
append_system_prompt: "This session has no repository and no files to edit. Answer in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Summarise this standup in three bullets: Ana finished the login page and starts on password reset. Ben is blocked on the payments API keys from finance. Chen fixed the flaky checkout test and is reviewing Ana's PR.
