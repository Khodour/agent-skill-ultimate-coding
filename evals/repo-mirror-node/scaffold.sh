#!/usr/bin/env bash
# Builds a small Node API where each feature lives in src/modules/<name>/ with
# routes, service and test files, wired up in src/app.js.
# Used by evals/repo-mirror-node/case.yaml to check that new code mirrors that layout.
set -euo pipefail

mkdir -p src/core src/modules/users src/modules/orders

cat > package.json <<'EOF'
{
  "name": "shop-api",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/core/db.js <<'EOF'
/** In-memory tables standing in for the real database in this example project. */
export const db = {
  users: [{ id: 1, name: "Ana" }],
  orders: [{ id: 1, userId: 1, totalCents: 1250 }],
  products: [{ id: 1, name: "Mug", priceCents: 900, archived: false }],
};
EOF

cat > src/app.js <<'EOF'
/** Maps URL prefixes to each module's router. The HTTP server reads this table. */
import { usersRouter } from "./modules/users/users.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";

export const routes = {
  "/users": usersRouter,
  "/orders": ordersRouter,
};
EOF

cat > src/modules/users/users.service.js <<'EOF'
/** Reads users from the database. */
import { db } from "../../core/db.js";

/** All users, for the admin list. */
export function listUsers() {
  return db.users.map(({ id, name }) => ({ id, name }));
}
EOF

cat > src/modules/users/users.routes.js <<'EOF'
/** HTTP handlers for /users. Each handler takes a request and returns { status, body }. */
import { listUsers } from "./users.service.js";

export const usersRouter = {
  "GET /": () => ({ status: 200, body: listUsers() }),
};
EOF

cat > src/modules/users/users.test.js <<'EOF'
import { test } from "node:test";
import assert from "node:assert/strict";
import { listUsers } from "./users.service.js";

test("lists users with id and name", () => {
  assert.deepEqual(listUsers(), [{ id: 1, name: "Ana" }]);
});
EOF

cat > src/modules/orders/orders.service.js <<'EOF'
/** Reads orders from the database. */
import { db } from "../../core/db.js";

/** Orders of one user, newest first. */
export function listOrders(userId) {
  return db.orders.filter((o) => o.userId === userId).reverse();
}
EOF

cat > src/modules/orders/orders.routes.js <<'EOF'
/** HTTP handlers for /orders. */
import { listOrders } from "./orders.service.js";

export const ordersRouter = {
  "GET /": (req) => ({ status: 200, body: listOrders(req.user.id) }),
};
EOF

cat > src/modules/orders/orders.test.js <<'EOF'
import { test } from "node:test";
import assert from "node:assert/strict";
import { listOrders } from "./orders.service.js";

test("lists only the user's orders", () => {
  assert.equal(listOrders(1).length, 1);
  assert.equal(listOrders(2).length, 0);
});
EOF
