---
type: llm
---

PASS only if a failed read can never be treated as an empty cart: when Redis errors or times out, or the stored JSON is corrupt, `loadCart` raises or returns an explicit error, and `addToCart` stops instead of saving a new cart over the real one. A missing key (null) may become an empty cart.

FAIL if any Redis error or corrupt JSON turns into an empty cart (for example a catch-all that returns `{ items: [] }`) that `addToCart` could then save over the customer's real cart.
