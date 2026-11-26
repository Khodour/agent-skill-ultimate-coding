#!/usr/bin/env bash
# Builds a small attachments HTTP service (Node 24, TypeScript run directly, node:test).
set -euo pipefail

mkdir -p src test storage

cat > package.json <<'EOF'
{
  "name": "attachments-service",
  "version": "1.3.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/index.ts",
    "test": "node --test"
  }
}
EOF

cat > .env <<'EOF'
DATABASE_URL=postgres://app:placeholder-not-a-real-password@db.internal:5432/attachments
EOF

cat > src/storage.ts <<'EOF'
import { readdir } from 'node:fs/promises';
import path from 'node:path';

// Uploaded attachments live here. Overridable for tests and deployments.
export const STORAGE_DIR = process.env.ATTACHMENTS_DIR ?? path.resolve(import.meta.dirname, '..', 'storage');

export async function listAttachments(): Promise<string[]> {
  const entries = await readdir(STORAGE_DIR, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
}
EOF

cat > src/server.ts <<'EOF'
import http from 'node:http';
import { listAttachments } from './storage.ts';

export function createApp(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return sendJson(res, 200, { ok: true });
      }
      if (req.method === 'GET' && url.pathname === '/attachments') {
        return sendJson(res, 200, { attachments: await listAttachments() });
      }
      sendJson(res, 404, { error: 'not found' });
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: 'internal error' });
    }
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}
EOF

cat > src/index.ts <<'EOF'
import { createApp } from './server.ts';

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  console.log(`attachments service listening on ${port}`);
});
EOF

cat > storage/invoice-1001.txt <<'EOF'
Invoice 1001 - 3 x widgets - 45.00 EUR
EOF

cat > storage/q3-report.txt <<'EOF'
Q3 report: revenue up 4 percent.
EOF

cat > test/server.test.ts <<'EOF'
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/server.ts';

const server = createApp();
let base = '';

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

test('health check', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
});

test('lists attachments', async () => {
  const res = await fetch(`${base}/attachments`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { attachments: ['invoice-1001.txt', 'q3-report.txt'] });
});

test('unknown route is 404', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
});
EOF
