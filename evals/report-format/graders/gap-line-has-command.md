---
type: regex
target: last_message
match: contains
pattern: '```diff\n(?:[^\n]*\n)*?- [^\n]*(`[^`\n]+`|command above|[Rr]un(?: it| them)?(?: with)?:?\s+(?:python3?|pytest|npm|node|go|cargo|bash|ruby|java)\b)'
---
