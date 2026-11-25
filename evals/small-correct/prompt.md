---
description: A small task (one pure parser) is still correct on edge inputs; the short card must not cost correctness.
tags: [sizing, correctness]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Our video app stores clip lengths as text like `1h 02m 05s`, `4m 09s` or `7s`. Write a Python function `parse_duration(text)` that turns that text back into a number of seconds.
