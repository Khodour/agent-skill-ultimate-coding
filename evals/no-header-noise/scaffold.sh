#!/usr/bin/env bash
# Builds a legacy pricing module with no docstrings or comments and one wrong
# coupon rate. A one-line fix must not grow into headers and comments across the
# file. Used by evals/no-header-noise.
set -euo pipefail
mkdir -p shop tests

cat > README.md <<'EOF'
# shop

Run the tests: `python3 -m unittest`
EOF

cat > shop/__init__.py <<'EOF'
EOF

cat > shop/legacy_pricing.py <<'EOF'
from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
VAT_RATES = {"standard": Decimal("0.20"), "reduced": Decimal("0.05"), "zero": Decimal("0")}
COUPONS = {"SAVE10": Decimal("0.10"), "SAVE20": Decimal("0.10"), "WELCOME5": Decimal("0.05")}
SHIPPING_BANDS = [(Decimal("1"), Decimal("3.50")), (Decimal("5"), Decimal("6.00")), (Decimal("20"), Decimal("12.00"))]
FREE_SHIPPING_FROM = Decimal("60.00")


def to_money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def vat_rate(category):
    return VAT_RATES.get(category, VAT_RATES["standard"])


def add_vat(net, category):
    return to_money(net * (1 + vat_rate(category)))


def remove_vat(gross, category):
    return to_money(gross / (1 + vat_rate(category)))


def line_net(unit_price, qty):
    return to_money(unit_price * qty)


def line_gross(unit_price, qty, category):
    return add_vat(line_net(unit_price, qty), category)


def cart_net(lines):
    total = Decimal("0")
    for unit_price, qty, _category in lines:
        total += line_net(unit_price, qty)
    return to_money(total)


def cart_gross(lines):
    total = Decimal("0")
    for unit_price, qty, category in lines:
        total += line_gross(unit_price, qty, category)
    return to_money(total)


def coupon_rate(code):
    return COUPONS.get(code.strip().upper(), Decimal("0"))


def apply_coupon(amount, code):
    return to_money(amount * (1 - coupon_rate(code)))


def shipping_for_weight(weight_kg):
    for max_kg, price in SHIPPING_BANDS:
        if weight_kg <= max_kg:
            return price
    return SHIPPING_BANDS[-1][1] + to_money((weight_kg - SHIPPING_BANDS[-1][0]) * Decimal("0.50"))


def shipping(amount, weight_kg):
    if amount >= FREE_SHIPPING_FROM:
        return Decimal("0.00")
    return shipping_for_weight(weight_kg)


def order_total(lines, weight_kg, coupon=""):
    goods = cart_gross(lines)
    if coupon:
        goods = apply_coupon(goods, coupon)
    return to_money(goods + shipping(goods, weight_kg))


def price_per_unit(total, qty):
    if qty <= 0:
        raise ValueError("qty must be positive")
    return to_money(total / qty)


def format_price(amount, currency="EUR"):
    return f"{to_money(amount)} {currency}"
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_legacy_pricing.py <<'EOF'
import unittest
from decimal import Decimal

from shop.legacy_pricing import apply_coupon, order_total


class PricingTest(unittest.TestCase):
    def test_save10(self):
        self.assertEqual(apply_coupon(Decimal("100.00"), "SAVE10"), Decimal("90.00"))

    def test_order_total_with_free_shipping(self):
        lines = [(Decimal("50.00"), 1, "standard")]
        self.assertEqual(order_total(lines, Decimal("2")), Decimal("60.00"))


if __name__ == "__main__":
    unittest.main()
EOF
