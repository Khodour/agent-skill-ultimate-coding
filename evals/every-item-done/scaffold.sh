#!/usr/bin/env bash
# Builds a tiny shop with an Order model and no export yet. The prompt lists eight
# requirements (one in a sentence after the list). Used by evals/every-item-done.
set -euo pipefail
mkdir -p shop exports tests

cat > README.md <<'EOF'
# shop

Back office. Run the tests: `python3 -m unittest`
EOF

cat > shop/__init__.py <<'EOF'
"""Shop back office."""
EOF

cat > shop/models.py <<'EOF'
"""Orders as the back office stores them."""
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Order:
    """A placed order; total is integer cents, created_at is a UTC datetime."""
    id: int
    customer: str
    total_cents: int
    created_at: datetime
EOF

cat > exports/__init__.py <<'EOF'
"""CSV exports."""
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_models.py <<'EOF'
"""Tests for shop.models."""
import unittest
from datetime import datetime, timezone

from shop.models import Order


class OrderTest(unittest.TestCase):
    def test_order_holds_cents(self):
        order = Order(1, "Ana", 1999, datetime(2026, 3, 1, tzinfo=timezone.utc))
        self.assertEqual(order.total_cents, 1999)


if __name__ == "__main__":
    unittest.main()
EOF
