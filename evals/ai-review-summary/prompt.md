---
description: An AI summary on a busy page is cached, shown as text, and cannot break the page.
tags: [performance, security, ai]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Show an AI summary of each product's customer reviews on the product page. Write the code in TypeScript.

```ts
// Available on the server:
//   llm.complete(prompt: string): Promise<string>
//   db.products.get(id): Promise<Product>
//   db.reviews.forProduct(id): Promise<Review[]>    Review: { id, rating, text, createdAt }
//
// app/products/[id]/page.tsx (Next.js server component) — product pages get
// about 50,000 views a day.
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.products.get(params.id);
  const reviews = await db.reviews.forProduct(params.id);
  return <ProductView product={product} reviews={reviews} />;
}
```
