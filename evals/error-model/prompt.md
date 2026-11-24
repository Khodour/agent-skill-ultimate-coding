---
description: Not-found and failures are kept apart; unexpected errors are not swallowed.
tags: [correctness, errors]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Our mobile app shows "Profile not found" even when the server is down. Here is the code. Fix it.

```ts
// api/profile.ts
export async function getProfile(db: Db, userId: string): Promise<Profile | null> {
  try {
    const row = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return row ? toProfile(row) : null;
  } catch {
    return null;
  }
}

// routes/profile.ts (Express)
router.get('/profile/:id', async (req, res) => {
  const profile = await getProfile(db, req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});
```
