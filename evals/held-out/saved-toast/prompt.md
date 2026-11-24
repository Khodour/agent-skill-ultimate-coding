---
description: "Held out: new UI text goes through the app's translation function even when the file does not use it yet."
tags: [held-out, ui, i18n]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

After the profile form saves, show a toast that says the profile was saved. If saving fails, show a toast with an error.

```tsx
// src/screens/ProfileForm.tsx. The app is in English and Arabic: src/i18n.ts exports t(key, vars?),
// strings live in locales/en.json and locales/ar.json. toast.show(message: string) shows a toast.
export function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState(profile);
  async function onSubmit() {
    await api.saveProfile(form);
  }
  return <Form value={form} onChange={setForm} onSubmit={onSubmit} />;
}
```
