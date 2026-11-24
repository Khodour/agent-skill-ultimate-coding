---
description: Renaming a field that shipped clients read must not break them.
tags: [existing-code, compatibility]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

The frontend team wants clearer names. Rename the `price` field to `amount_cents` in this product API response.

```ts
// products/serialize.ts
// Used by GET /api/products/:id, which our web app and our iOS and Android apps call.

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    name: p.name,
    price: p.priceCents,
    currency: p.currency,
  };
}
```
