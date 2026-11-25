---
type: llm
---

PASS only if all are true:
1. After a move, every book's `rank` is consistent: the ranks are unique and still form one order with no duplicates or gaps (for example 1..n), so the books between the old and new place are shifted too, not only the moved book changed.
2. The reducer does not mutate the existing state or book objects; it returns new values.
3. It handles at least: moving to the same place, and a `toRank` outside 1..n (clamped or rejected), or an unknown `bookId`.
4. The save sends the ranks of every book whose rank changed (or the whole list), not only the moved book.

FAIL if only the moved book's rank is changed (leaving two books with the same rank), or the state is mutated in place.
