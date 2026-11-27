---
type: regex
target: last_message
match: not_contains
flags: m
pattern: '(?:^[-*] (?!Not |Tests? |`?Choice|`?Noticed|Warning)[^\n]*\n){3,}'
---
