---
description: Money must be exact and shares must add up to the total.
tags: [correctness, money]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Write a JavaScript function `splitBill(subtotal, tipPercent, people)` for our restaurant app. It adds the tip to the bill and splits the total evenly between the people. `subtotal` is in dollars, for example `87.35`. It returns what each person pays.
