---
type: llm
---

The original function runs one customer query per order (an N+1 query: 1 + 50 queries).

PASS only if both are true:
1. The returned code includes the customer's email for each order.
2. The returned code no longer queries the customers table once per order: it uses a JOIN, or one batched query (for example `WHERE id IN (...)`) for all customers, so the function runs a fixed small number of queries.

FAIL if the code still runs a customer query inside the loop, even if the response mentions the N+1 problem.
