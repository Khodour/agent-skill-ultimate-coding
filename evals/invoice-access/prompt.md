---
description: Access must be checked per record, not just "logged in".
tags: [security]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Implement `GetInvoice` in Go: `GET /invoices/{id}` returns the invoice as JSON for the logged-in user.

```go
// invoices/handler.go
package invoices

func GetInvoice(w http.ResponseWriter, r *http.Request) {
	// TODO
}

// Available helpers:
//   auth.CurrentUser(r *http.Request) (*User, error)       // error if not logged in
//   store.FindInvoice(ctx context.Context, id int64) (*Invoice, error)  // store.ErrNotFound if missing
//
// type User struct    { ID int64; CompanyID int64; Role string }
// type Invoice struct { ID int64; CompanyID int64; TotalCents int64; Currency string }
//
// The id comes from the path: r.PathValue("id")
```
