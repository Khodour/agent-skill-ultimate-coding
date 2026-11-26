---
type: regex
target: last_message
match: contains
pattern: 'I have (medium|low) confidence in this change[^\n]*\n(?:[^\n]*\n)*?\s*\**1[.)]\s[^\n]*recommended[^\n]*\n\s*\**2[.)]\s[^\n]*(?:\n\s*\**[3-9][.)]\s[^\n]*)*\s*$'
---
