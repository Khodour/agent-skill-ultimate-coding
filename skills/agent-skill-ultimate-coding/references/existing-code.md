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

### 4. Never break what is shipped (MUST)
With enough users, someone depends on every behaviour. Public APIs, old app versions still installed, saved data, file formats, URLs, settings and command flags keep working.

- **Change by adding:** a new optional field, a new endpoint version, a new flag. Old callers keep working.
- **Deprecate before removing:** mark it, tell users, remove it only when nothing uses it.
- Never rename or change the type of a field that clients already read.

```text
❌ rename response field "price" to "amount"        old apps break
✅ add "amount", keep "price" until old apps are gone
```

### 5. Stored data with care (MUST)
- **Schema changes work with old and new code at the same time** during a rollout: add the new column → copy or fill the data → switch the code → remove the old column in a later release.
- Test migrations on a copy of real-shaped data first. Know how to roll back.
- **Never delete, drop, empty or overwrite stored data without the user's explicit OK** (MUST 7), even to "fix" a failing migration.

### 6. Clean the area you touch, report the rest
Inside the files you are changing: remove dead code, unused imports and small rot. Outside them, don't touch anything; list what you noticed under "Noticed, not touched" in the report.

### 7. Keep each change focused
- One task per change.
- No reformatting of whole files along the way; it hides the real change.
- **Restructure first, then change behaviour, as two separate steps.** Never mix them in one change.

### 8. Keep the docs true
When behaviour changes, update the README, project docs (such as `CLAUDE.md` or `AGENTS.md`), API docs and comments **in the same change**. A stale doc is a bug.
