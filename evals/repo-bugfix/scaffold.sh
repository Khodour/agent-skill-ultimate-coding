#!/usr/bin/env bash
# Builds a small Python shop project with an off-by-one bug in bulk pricing.
# Used by evals/repo-bugfix/case.yaml: the agent works in this real folder and can run its tests.
set -euo pipefail

mkdir -p shop tests

cat > README.md <<'EOF'
# shop

Cart pricing for the checkout.

Run the tests: `python3 -m unittest`
EOF

cat > shop/__init__.py <<'EOF'
"""Shop pricing package."""
EOF

cat > shop/cart.py <<'EOF'
"""Cart totals for the checkout page and the order emails."""
from decimal import Decimal

# Lines with at least this many items get the bulk discount.
BULK_MIN_QTY = 10
BULK_DISCOUNT = Decimal("0.05")


def line_total(unit_price: Decimal, qty: int) -> Decimal:
    """Price of one cart line, with the bulk discount when it applies."""
    total = unit_price * qty
    if qty > BULK_MIN_QTY:
        total -= total * BULK_DISCOUNT
    return total.quantize(Decimal("0.01"))


def cart_total(lines: list[tuple[Decimal, int]]) -> Decimal:
    """Sum of all cart lines; each line is (unit_price, qty)."""
    return sum((line_total(price, qty) for price, qty in lines), Decimal("0.00"))
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_cart.py <<'EOF'
"""Tests for shop.cart."""
import unittest
from decimal import Decimal

from shop.cart import cart_total, line_total


class LineTotalTest(unittest.TestCase):
    def test_small_quantity_has_no_discount(self):
        self.assertEqual(line_total(Decimal("4.00"), 3), Decimal("12.00"))

    def test_large_quantity_gets_bulk_discount(self):
        self.assertEqual(line_total(Decimal("2.00"), 20), Decimal("38.00"))


class CartTotalTest(unittest.TestCase):
    def test_sums_lines(self):
        lines = [(Decimal("4.00"), 3), (Decimal("2.00"), 20)]
        self.assertEqual(cart_total(lines), Decimal("50.00"))


if __name__ == "__main__":
    unittest.main()
EOF
