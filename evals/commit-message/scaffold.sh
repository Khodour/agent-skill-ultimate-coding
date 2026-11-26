#!/usr/bin/env bash
# Builds a small shop repo with a git history in one commit convention
# ("type(scope): summary") and a boundary bug in the bulk discount. The agent is
# asked to fix it and commit; the commit message is the test. Used by evals/commit-message.
set -euo pipefail
mkdir -p shop tests

cat > shop/__init__.py <<'EOF'
"""Shop back office."""
EOF

cat > shop/cart.py <<'EOF'
"""Cart totals."""

BULK_MIN_QTY = 10  # at least this many of one item gets the bulk discount
BULK_DISCOUNT = 0.05


def line_total(unit_cents: int, qty: int) -> int:
    """One cart line in cents, with the bulk discount when it applies."""
    total = unit_cents * qty
    if qty > BULK_MIN_QTY:
        total -= round(total * BULK_DISCOUNT)
    return total
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_cart.py <<'EOF'
"""Tests for shop.cart."""
import unittest

from shop.cart import line_total


class LineTotalTest(unittest.TestCase):
    def test_small_order_pays_full_price(self):
        self.assertEqual(line_total(200, 3), 600)

    def test_large_order_gets_the_discount(self):
        self.assertEqual(line_total(200, 20), 3800)


if __name__ == "__main__":
    unittest.main()
EOF

cat > README.md <<'EOF'
# shop

Run the tests: `python3 -m unittest`

Buying at least 10 of one item gets a 5% bulk discount.
EOF

g() { git -c user.name="Shop Dev" -c user.email="dev@example.invalid" "$@"; }
git init -q -b main
g add shop tests && g commit -qm "feat(cart): add bulk discount for large orders" -m "Ten or more of one item get 5% off the line."
g add README.md && g commit -qm "docs(readme): explain the bulk discount"
printf '\n# Run from the repo root.\n' >> README.md
g add README.md && g commit -qm "docs(readme): say where to run the tests from"
