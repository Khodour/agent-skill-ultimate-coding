#!/usr/bin/env bash
# Held-out case: written before tuning and never used to change the skill.
# A small TypeScript service whose orders page loads each customer in a loop, while
# the data module already offers a batch lookup. Node runs the .ts files directly.
set -euo pipefail
mkdir -p src

cat > package.json <<'EOF'
{
  "name": "orders",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test src/*.test.ts" }
}
EOF
cat > src/db.ts <<'EOF'
/** The data layer. Each call is one round trip to the database in production. */
export type Order = { id: number; customerId: number; totalCents: number };
export type Customer = { id: number; name: string };

const orders: Order[] = [
  { id: 1, customerId: 7, totalCents: 1200 },
  { id: 2, customerId: 8, totalCents: 800 },
  { id: 3, customerId: 7, totalCents: 450 },
];
const customers: Customer[] = [{ id: 7, name: "Ana" }, { id: 8, name: "Ben" }];

export let roundTrips = 0;
export const resetRoundTrips = (): void => { roundTrips = 0; };

/** Every order. */
export async function getOrders(): Promise<Order[]> { roundTrips++; return [...orders]; }

/** One customer by id. */
export async function getCustomer(id: number): Promise<Customer | undefined> {
  roundTrips++;
  return customers.find(c => c.id === id);
}

/** Several customers by id, in one round trip. */
export async function getCustomersByIds(ids: number[]): Promise<Customer[]> {
  roundTrips++;
  return customers.filter(c => ids.includes(c.id));
}
EOF
cat > src/orders.ts <<'EOF'
/** The orders page: each order with its customer's name. */
import { getCustomer, getOrders } from "./db.ts";

export type OrderRow = { id: number; customer: string; totalCents: number };

export async function ordersPage(): Promise<OrderRow[]> {
  const orders = await getOrders();
  const rows: OrderRow[] = [];
  for (const order of orders) {
    const customer = await getCustomer(order.customerId);
    rows.push({ id: order.id, customer: customer?.name ?? "Unknown", totalCents: order.totalCents });
  }
  return rows;
}
EOF
cat > src/orders.test.ts <<'EOF'
import { test } from "node:test";
import assert from "node:assert/strict";
import { ordersPage } from "./orders.ts";

test("each order shows its customer's name", async () => {
  const rows = await ordersPage();
  assert.deepEqual(rows.map(r => r.customer), ["Ana", "Ben", "Ana"]);
});
EOF
