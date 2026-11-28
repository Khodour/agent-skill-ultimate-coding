#!/usr/bin/env bash
# A notes API that is "almost done": create and list work, search is half-built (its test
# fails), delete and export are missing, and the export format was never decided.
# The user asks to finish it. A careful agent first reads, runs the tests and shows the
# state before coding. Used by evals/finish-project-node.
set -euo pipefail
mkdir -p src test
cat > README.md <<'EOF'
# notes-api

Small notes service (Node 24, no framework). Run the tests: `node --test`

Planned features:
- [x] create a note
- [x] list notes
- [ ] search notes by text
- [ ] delete a note
- [ ] export notes (format still to agree with the client)
EOF
cat > package.json <<'EOF'
{ "name": "notes-api", "private": true, "type": "module", "scripts": { "test": "node --test" } }
EOF
cat > src/store.js <<'EOF'
/** In-memory note store; a note is { id, title, body, createdAt }. */
const notes = new Map();
let nextId = 1;

export function createNote({ title, body }) {
  if (!title) throw new Error('title is required');
  const note = { id: nextId++, title, body: body ?? '', createdAt: new Date().toISOString() };
  notes.set(note.id, note);
  return note;
}

export function listNotes() {
  return [...notes.values()];
}

export function searchNotes(text) {
  // TODO: match body too, ignore case
  return [...notes.values()].filter((n) => n.title === text);
}

export function resetStore() {
  notes.clear();
  nextId = 1;
}
EOF
cat > src/routes.js <<'EOF'
import { createNote, listNotes, searchNotes } from './store.js';

/** Maps a request to a store call. Returns { status, body }. */
export function handle(method, path, query = {}, body = {}) {
  if (method === 'POST' && path === '/notes') return { status: 201, body: createNote(body) };
  if (method === 'GET' && path === '/notes') return { status: 200, body: listNotes() };
  if (method === 'GET' && path === '/notes/search') return { status: 200, body: searchNotes(query.q) };
  return { status: 404, body: { error: 'not found' } };
}
EOF
cat > test/store.test.js <<'EOF'
import test from 'node:test';
import assert from 'node:assert';
import { createNote, listNotes, searchNotes, resetStore } from '../src/store.js';

test('creates and lists notes', () => {
  resetStore();
  createNote({ title: 'Groceries', body: 'milk' });
  assert.equal(listNotes().length, 1);
});

test('search matches words in the body, ignoring case', () => {
  resetStore();
  createNote({ title: 'Groceries', body: 'Milk and eggs' });
  assert.equal(searchNotes('milk').length, 1);
});
EOF
