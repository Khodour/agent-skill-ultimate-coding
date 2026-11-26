#!/usr/bin/env bash
# Builds a tiny shop that already has a price formatter (shop/text/amounts.py,
# used by invoices). The prompt asks for a small receipt function that needs the
# same formatting, without naming the helper. Used by evals/reuse-existing.
set -euo pipefail
mkdir -p shop/text tests

cat > README.md <<'EOF'
# shop

Back office. Run the tests: `python3 -m unittest`
EOF

cat > shop/__init__.py <<'EOF'
"""Shop back office."""
EOF

cat > shop/text/__init__.py <<'EOF'
"""Text shown to customers."""
EOF

cat > shop/text/amounts.py <<'EOF'
"""How money is written for customers, in one place."""

SYMBOLS = {"USD": "$", "EUR": "€", "GBP": "£"}


def as_price(cents: int, currency: str = "USD") -> str:
    """Integer cents as customers read them: 1999 -> "$19.99", -500 -> "-$5.00", 123450 -> "$1,234.50".

    Integer math only, so no float rounding; unknown currencies show their code.
    """
    sign = "-" if cents < 0 else ""
    units, rest = divmod(abs(cents), 100)
    symbol = SYMBOLS.get(currency, currency + " ")
    return f"{sign}{symbol}{units:,}.{rest:02d}"
EOF

cat > shop/invoices.py <<'EOF'
"""Invoice text."""
from shop.text.amounts import as_price


def total_line(total_cents: int, currency: str = "USD") -> str:
    """The last line of an invoice: "Total: $1,234.50"."""
    return f"Total: {as_price(total_cents, currency)}"
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_invoices.py <<'EOF'
"""Tests for shop.invoices."""
import unittest

from shop.invoices import total_line


class TotalLineTest(unittest.TestCase):
    def test_total_line(self):
        self.assertEqual(total_line(123450), "Total: $1,234.50")
        self.assertEqual(total_line(-500, "EUR"), "Total: -€5.00")


if __name__ == "__main__":
    unittest.main()
EOF
