---
type: llm
---

PASS only if all are true:
1. The model is not called on every page view: the summary is stored or cached per product and only regenerated when the reviews change or after a set time (a cache, a stored column, or a background job all count).
2. The summary is shown as plain text through normal escaping. No dangerouslySetInnerHTML; if markdown is rendered, raw HTML is disabled.
3. If the model call fails or is slow, the product page still renders (without the summary or with the old one); the call has a timeout or runs outside the page request.

FAIL if llm.complete is awaited inside the page render for every request.
