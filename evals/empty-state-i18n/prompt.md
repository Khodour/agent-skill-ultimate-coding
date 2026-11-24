---
description: New UI text goes through translation and the layout stays right-to-left safe.
tags: [ui, i18n, rtl]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add an empty state to `OrdersList`: when there are no orders, show a short message and a button that takes the user to the shop.

```tsx
// components/OrdersList.tsx  (the app ships in English and Arabic)
import { useTranslation } from 'react-i18next';

export function OrdersList({ orders, onShop }: { orders: Order[]; onShop: () => void }) {
  const { t } = useTranslation();
  return (
    <section style={{ padding: 16 }}>
      <h2>{t('orders.title')}</h2>
      <ul>{orders.map((o) => <OrderRow key={o.id} order={o} />)}</ul>
    </section>
  );
}
```
