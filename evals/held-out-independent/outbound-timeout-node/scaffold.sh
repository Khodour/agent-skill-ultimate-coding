#!/usr/bin/env bash
# Builds a small checkout service that calls other services over HTTP (Node 24, TypeScript run directly, node:test).
set -euo pipefail

mkdir -p src test

cat > package.json <<'EOF'
{
  "name": "checkout-service",
  "version": "2.4.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF

cat > src/config.ts <<'EOF'
export const INVENTORY_URL = process.env.INVENTORY_URL ?? 'http://inventory.internal:8080';

// Exchange-rate provider. GET returns {"base":"EUR","rates":{"USD":1.0842,"GBP":0.8571,...}}
export const RATES_URL = process.env.RATES_URL ?? 'https://rates.example.com/v1/latest?base=EUR';
EOF

cat > src/inventory.ts <<'EOF'
import { INVENTORY_URL } from './config.ts';

export async function getStock(sku: string): Promise<number> {
  const res = await fetch(`${INVENTORY_URL}/stock/${encodeURIComponent(sku)}`);
  if (!res.ok) {
    throw new Error(`inventory returned ${res.status} for ${sku}`);
  }
  const body = (await res.json()) as { available: number };
  return body.available;
}
EOF

cat > src/checkout.ts <<'EOF'
import { getStock } from './inventory.ts';

export type CartLine = { sku: string; unitPriceCents: number; quantity: number };

export type CheckoutSummary = {
  lines: CartLine[];
  totalCents: number;
  currency: 'EUR';
};

export type CheckoutDeps = {
  getStock: (sku: string) => Promise<number>;
};

const defaultDeps: CheckoutDeps = { getStock };

export async function buildSummary(lines: CartLine[], deps: CheckoutDeps = defaultDeps): Promise<CheckoutSummary> {
  for (const line of lines) {
    const available = await deps.getStock(line.sku);
    if (available < line.quantity) {
      throw new Error(`Not enough stock for ${line.sku}`);
    }
  }
  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  return { lines, totalCents, currency: 'EUR' };
}
EOF

cat > test/checkout.test.ts <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary } from '../src/checkout.ts';

const inStock = { getStock: async () => 100 };

test('totals the cart in cents', async () => {
  const summary = await buildSummary(
    [
      { sku: 'MUG-01', unitPriceCents: 1299, quantity: 2 },
      { sku: 'TEE-02', unitPriceCents: 2500, quantity: 1 },
    ],
    inStock,
  );
  assert.equal(summary.totalCents, 5098);
  assert.equal(summary.currency, 'EUR');
});

test('refuses when stock is short', async () => {
  await assert.rejects(
    buildSummary([{ sku: 'MUG-01', unitPriceCents: 1299, quantity: 5 }], { getStock: async () => 2 }),
    /Not enough stock/,
  );
});
EOF
