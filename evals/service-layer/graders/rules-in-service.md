---
type: llm
---

Look only at where the borrowing rules live. The rules are: at most 3 active loans, the book not already on an active loan, and no unpaid fines.

PASS only if all of them, and the transaction or locking that protects them, are in a function or module that takes plain values (such as a member id and a book id, plus a db pool or client) and never `req` or `res`; and the route handler only reads the input, calls that function, and turns its result or typed error into a response.

FAIL if the route handler itself runs any of those checks, opens or commits the transaction, or runs the rule queries. A handler that only does the auth check, input parsing, one call, and error-to-status mapping passes.
