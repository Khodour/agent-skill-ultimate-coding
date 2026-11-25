# Working with existing code

Most work happens in code that already exists. These rules keep changes safe in it. Read this when a task changes existing code, an API or a database schema.

**Contents**
- 1 Read before you write
- 2 Follow the house style, never copy a danger
- 3 Don't remove what you don't understand
- 4 Never break what is shipped (MUST)
- 5 Stored data with care (MUST)
- 6 Clean the area you touch, report the rest
- 7 Keep each change focused
- 8 Keep the docs true

---

### 1. Read before you write
Before changing an area, learn how it works: who calls it, its tests, the patterns around it, and (when something looks odd) its history in version control.

**Libraries: trust the installed version, not memory.** APIs change between versions, and a remembered signature is often from an older one. Before using a library call you have not seen in this project, check it in this order:

1. **The version in use:** the lock or manifest file (`package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock`, `composer.lock`, `Gemfile.lock`, …).
2. **The installed package itself:** its type definitions, docstrings or source where the ecosystem keeps installed packages (`node_modules/<pkg>`, the Python environment's `site-packages/<pkg>`, `vendor/`, the module cache). These folders are usually git-ignored, so file search and glob tools skip them: open or list the path directly (for example `.venv/lib/python3.12/site-packages/<pkg>/__init__.py`) instead of concluding the package is missing.
3. **The official docs for that exact version**, when a docs tool or the web is available.
4. **Still unsure:** a tiny script or test that calls the API and runs.

```text
❌ write `client.charges.create(amount=…)` from memory, version 2 syntax,
   while the lock file pins version 5, where it is `client.payments.create(…)`
✅ read the lock file (v5), open the installed package's types, use what is there
```

### 2. Follow the house style, but never copy a danger
Match the project's patterns, naming, structure and libraries, even if you prefer something else. Consistency beats personal taste; suggest improvements separately.

**Exception:** never copy a pattern that is a security hole or a bug (string-built SQL, weak password hashing, swallowed errors). Write the new code safely and point out the old pattern in the report.

**Messy but not dangerous** (giant files, globals everywhere): **don't make it worse.** Follow the project's structure, but put new code in new small pieces instead of growing the giant file. Suggest the bigger refactor in the report; never do it uninvited.

### 3. Don't remove what you don't understand
Before deleting or changing odd-looking code, find out why it is there: comments, callers, tests, version-control history. If you cannot find out, leave it, and either flag it in the report or ask.

```text
// looks useless:
if (retries == 0) sleep(50ms)

// history shows: "fix: the payment provider rejects instant retries (issue #311)"
```

### 4. Never break what is shipped (MUST 8)
With enough users, someone depends on every behaviour. Public APIs, old app versions still installed, saved data, file formats, URLs, settings and command flags keep working.

- **Change by adding:** a new optional field, a new endpoint version, a new flag. Old callers keep working.
- **Deprecate before removing:** mark it, tell users, remove it only when nothing uses it.
- Never rename or change the type of a field that clients already read.
- **Risky behaviour changes ship with a way back:** a switch (feature flag or setting) that turns them off without a deploy, or a revert you have tested. Know the way back before you ship.

```text
❌ rename response field "price" to "amount"        old apps break
✅ add "amount", keep "price" until old apps are gone
```

### 5. Stored data with care (MUST 7)
- **Schema changes work with old and new code at the same time** during a rollout: add the new column → copy or fill the data → switch the code → remove the old column in a later release.
- Test migrations on a copy of real-shaped data first. Know how to roll back.
- **Never delete, drop, empty or overwrite stored data without the user's explicit OK** (MUST 7), even to "fix" a failing migration.

### 6. Clean the area you touch, report the rest
Inside the files you are changing: remove dead code, unused imports and small rot. Outside them, don't touch anything; list what you noticed under "Found elsewhere, not touched" in the report.

**A real problem inside the code you are changing is fixed, not extended.** If the function you are editing has an N+1 query, an injection, a race or a money bug, fix it in this change (keeping its behaviour) and say so in the report. "Found elsewhere, not touched" is for code you are *not* changing.

```text
task: "show each author's avatar in list_posts()", which loads every author separately
❌ add avatar to the per-post author lookup, list the N+1 under "Found elsewhere, not touched"
✅ one batched lookup for all authors (same results), avatar added, the fix named in the report
```

### 7. Keep each change focused
- One task per change.
- No reformatting of whole files along the way; it hides the real change.
- **When a task needs both restructuring and a behaviour change, do them as two separate steps**, one after the other, so each can be checked on its own. This is about order, never a reason to skip a needed fix.

### 8. Keep the docs true
When behaviour changes, update the README, project docs (such as `CLAUDE.md` or `AGENTS.md`), API docs and comments **in the same change**. A stale doc is a bug.
