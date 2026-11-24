#!/usr/bin/env bash
# Builds a small Node dashboard module whose numbers are slow to compute and differ per user.
# Used by evals/held-out/user-cache/case.yaml: a cache must never show one user another's numbers.
set -euo pipefail

mkdir -p src/core src/modules/dashboard

cat > package.json <<'EOF'
{
  "name": "dashboard-api",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
EOF

cat > src/core/db.js <<'EOF'
/** In-memory tables standing in for the real database. slowQuery simulates a heavy report query. */
export const db = {
  orders: [
    { id: 1, userId: 1, totalCents: 1200 },
    { id: 2, userId: 2, totalCents: 800 },
    { id: 3, userId: 1, totalCents: 300 },
  ],
};

/** Runs fn after a delay, like a slow aggregate query. */
export async function slowQuery(fn) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return fn(db);
}
EOF

cat > src/modules/dashboard/dashboard.service.js <<'EOF'
/** Numbers for the signed-in user's dashboard. Called on every dashboard page load. */
import { slowQuery } from "../../core/db.js";

/** Order count and total spent for one user. */
export async function getDashboard(userId) {
  return slowQuery((db) => {
    const mine = db.orders.filter((o) => o.userId === userId);
    return {
      orderCount: mine.length,
      totalCents: mine.reduce((sum, o) => sum + o.totalCents, 0),
    };
  });
}
EOF

cat > src/modules/dashboard/dashboard.routes.js <<'EOF'
/** HTTP handler for GET /dashboard. req.user is the signed-in user. */
import { getDashboard } from "./dashboard.service.js";

export const dashboardRouter = {
  "GET /": async (req) => ({ status: 200, body: await getDashboard(req.user.id) }),
};
EOF

cat > src/modules/dashboard/dashboard.test.js <<'EOF'
import { test } from "node:test";
import assert from "node:assert/strict";
import { getDashboard } from "./dashboard.service.js";

test("dashboard counts only the user's orders", async () => {
  assert.deepEqual(await getDashboard(1), { orderCount: 2, totalCents: 1500 });
});
EOF
