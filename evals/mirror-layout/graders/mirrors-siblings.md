---
type: llm
---

The project keeps one model per file in `apps/billing/models/`, exports each from `models/__init__.py`, registers each in `admin.py`, and has numbered migrations.

PASS only if all are true:
1. `Coupon` goes in its own file, `apps/billing/models/coupon.py`, in the same style as the sibling models.
2. It is exported from `apps/billing/models/__init__.py`.
3. It is registered in `apps/billing/admin.py`, like the siblings.
4. A migration is provided (for example `0003_coupon.py`) or the response clearly says to run `makemigrations` for it.

FAIL if the model is placed anywhere else (a new flat `models.py`, a new app or folder), or if any of the export, admin registration or migration steps is missing.
