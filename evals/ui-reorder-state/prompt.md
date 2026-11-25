---
description: "DAPLab pattern 2: a drag-and-drop move must leave the whole list consistent, not patch one item."
tags: [daplab, correctness, ui, state]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply."
allowed_tools: [Read, Glob, Grep, Skill]
---

Our reading-list app (React + TypeScript) shows the user's books sorted by `rank`. Add drag and drop: write the reducer case `MOVE_BOOK` that moves a book to a new place in the list, and the save call that tells the server.

```ts
type Book = { id: string; title: string; rank: number };   // rank 1 = top of the list
type State = { books: Book[] };
type Action = { type: 'MOVE_BOOK'; bookId: string; toRank: number };
// api.saveRanks(ranks: { id: string; rank: number }[]): Promise<void>
```
