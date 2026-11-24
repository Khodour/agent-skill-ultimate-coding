---
description: New code must mirror the project's existing nesting, file split and wiring.
tags: [structure, existing-code]
max_turns: 10
append_system_prompt: "This session has no repository and no files to edit. Give any code in your reply, with the path of each file."
allowed_tools: [Read, Glob, Grep, Skill]
---

Add a `Coupon` model to billing with a code, a percent off, and an expiry date.

Project layout:

```text
apps/
  billing/
    __init__.py
    apps.py
    admin.py
    models/
      __init__.py
      invoice.py
      payment.py
    migrations/
      0001_initial.py
      0002_payment.py
```

```python
# apps/billing/models/__init__.py
from .invoice import Invoice
from .payment import Payment
```

```python
# apps/billing/models/payment.py
from django.db import models


class Payment(models.Model):
    """A payment made against an invoice."""

    invoice = models.ForeignKey("billing.Invoice", on_delete=models.PROTECT, related_name="payments")
    amount_cents = models.PositiveIntegerField()
    paid_at = models.DateTimeField()
```

```python
# apps/billing/admin.py
from django.contrib import admin

from .models import Invoice, Payment

admin.site.register(Invoice)
admin.site.register(Payment)
```
