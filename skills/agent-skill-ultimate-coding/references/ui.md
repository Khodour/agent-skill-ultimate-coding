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

The common target today is WCAG 2.2 level AA; when the project names its own target, that wins. The numbers below are from WCAG 2.2: check the current version when one matters.

**Native first.** A real button, link, input or the platform's own control comes with its name, role, keyboard behaviour and focus for free. A custom control must rebuild all of them, and an accessibility role only promises that behaviour, it does not add it: no role is better than a wrong one.

- **Every control has a name a screen reader can say:** visible text, or an accessible label for an icon-only button. Inputs have labels, not only placeholders. Images that carry meaning have alt text; decorative ones are hidden from screen readers.
- **Everything works with the keyboard alone:** every action can be reached and done, in a sensible order, and focus never gets stuck in a component. The focus is always visible and never fully hidden behind a sticky header, banner or dialog.
- **Contrast:** at least 4.5:1 for text, 3:1 for large text and for the edges of controls and icons people need. Colour is never the only signal: an error also has an icon or text.
- **Size and spacing:** touch targets at least 24×24 CSS pixels on the web (the platforms ask for more: about 44×44 points on iOS, 48×48 dp on Android). Text can grow to 200% and the page still works at 320 CSS pixels wide, without content cut off or sideways scrolling.
- **Errors and changes are announced:** an error is described in text next to its field, with how to fix it when that is known. A status message that appears without moving the focus ("Saved", "3 results") is announced to screen readers (a live region, or the platform's announcement).
- **No action only by dragging or a precise gesture:** a drag, swipe or pinch also has a simple tap or button.
- **Don't ask twice:** information the person already entered in the same flow is filled in or offered, not typed again.
- **Logging in needs no memory test or puzzle** when another way exists: paste and password managers work, and a code can be copied rather than retyped.

**Check it in the real-user test:** go through the change with the keyboard alone, at 200% text size, and with the platform's screen reader when the change adds or alters a control. An automated checker finds only part of the problems.

### 5. Test it in the other language
**When the app has more than one language:** run the real-user test once in the other language, and once right to left if the app supports it. Look for untranslated text, cut-off or overflowing labels, mirrored layouts that broke, and dates or money in the wrong format.

---

### Sources

Checked on 2026-11-26. Re-read the original when a detail matters.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [what is new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [ARIA Authoring Practices Guide: read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
