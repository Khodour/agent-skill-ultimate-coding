# Interfaces people use

Text, languages, right-to-left layouts and accessibility. Read this when a task changes what people see or touch in a UI. For slow networks, offline behaviour and failing gently, see `resilience.md`.

**Contents**
- 1 Text goes through translation
- 2 The locale formats numbers, dates and money
- 3 Layouts work right to left
- 4 Everyone can use it
- 5 Test it in the other language

---

### 1. Text goes through translation
**When the app has a translation system, or more than one language:** every piece of user-facing text goes through it, including errors, empty states, button labels and emails. Translate whole sentences with placeholders, never fragments glued together, because word order differs between languages. Use the system's plural rules, not `count == 1 ? "item" : "items"`.

```text
❌ "You have " + n + " new " + (n == 1 ? "message" : "messages")
✅ t("inbox.new_messages", { count: n })    one key; the translation file holds each language's plural forms
```

### 2. The locale formats numbers, dates and money
Format with the platform's locale functions, never by hand: digits, decimal and thousands separators, date order, currency symbol and its position all differ.

```text
❌ "$" + amount.toFixed(2)          wrong in most countries
✅ formatMoney(amountCents, currency, locale)
```

### 3. Layouts work right to left
**When the app supports a right-to-left language** (Arabic, Hebrew, Persian, Urdu): use start/end, not left/right, for margins, padding, alignment and positions. Icons that show direction (back, next, send) mirror; logos, media controls and numbers do not.

### 4. Everyone can use it
- Every control has a label a screen reader can say (visible text, or an accessible label for icon-only buttons). Images that carry meaning have alt text.
- Everything works with the keyboard alone, and the focus is visible.
- Text has enough contrast; colour is never the only signal (an error also has an icon or text).
- Touch targets are at least about 44×44 points; text can grow with the system font size without breaking the layout.

### 5. Test it in the other language
**When the app has more than one language:** run the real-user test once in the other language, and once right to left if the app supports it. Look for untranslated text, cut-off or overflowing labels, mirrored layouts that broke, and dates or money in the wrong format.
