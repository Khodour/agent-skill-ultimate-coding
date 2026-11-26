#!/usr/bin/env bash
# Builds a small orders service that logs through its own JSON helper, log_event(),
# and a refund function that gives no trace when the payment gateway fails. The
# failure reason comes from the customer, so pasting it into a message invites log
# injection. Used by evals/structured-logging.
set -euo pipefail
mkdir -p app tests

cat > app/__init__.py <<'EOF'
"""Orders service."""
EOF

cat > app/log.py <<'EOF'
"""The service's one logger: every event is one JSON line with a name and fields."""
import json
import logging
import sys

_logger = logging.getLogger("orders")
_handler = logging.StreamHandler(sys.stdout)
_handler.setFormatter(logging.Formatter("%(message)s"))
_logger.addHandler(_handler)
_logger.setLevel(logging.INFO)


def log_event(event: str, level: int = logging.INFO, **fields) -> None:
    """Writes one event as a JSON line, e.g. log_event("order_created", order_id=7)."""
    _logger.log(level, json.dumps({"event": event, **fields}, default=str))
EOF

cat > app/gateway.py <<'EOF'
"""The payment gateway client."""


class GatewayError(Exception):
    """The gateway refused or failed a call; `code` is its error code."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def refund_payment(payment_id: str, amount_cents: int) -> str:
    """Refunds a payment and returns the refund id. Raises GatewayError on failure."""
    raise GatewayError("unavailable", "gateway is not configured in this sandbox")
EOF

cat > app/orders.py <<'EOF'
"""Creating orders."""
from app.log import log_event


def create_order(order_id: int, user_id: int, total_cents: int) -> dict:
    """Creates an order and records it."""
    order = {"id": order_id, "user_id": user_id, "total_cents": total_cents}
    log_event("order_created", order_id=order_id, user_id=user_id, total_cents=total_cents)
    return order
EOF

cat > app/refunds.py <<'EOF'
"""Refunding orders."""
from app import gateway


def refund_order(order_id: int, user_id: int, payment_id: str, amount_cents: int, reason: str) -> str:
    """Refunds an order through the gateway. `reason` is the customer's own text."""
    return gateway.refund_payment(payment_id, amount_cents)
EOF

cat > tests/__init__.py <<'EOF'
EOF
cat > tests/test_refunds.py <<'EOF'
"""Tests for app.refunds."""
import unittest
from unittest import mock

from app import refunds
from app.gateway import GatewayError


class RefundTest(unittest.TestCase):
    def test_success_returns_the_refund_id(self):
        with mock.patch("app.gateway.refund_payment", return_value="rf_1"):
            self.assertEqual(refunds.refund_order(7, 3, "pay_1", 500, "broken"), "rf_1")

    def test_gateway_failure_still_raises(self):
        with mock.patch("app.gateway.refund_payment", side_effect=GatewayError("declined", "no")):
            with self.assertRaises(GatewayError):
                refunds.refund_order(7, 3, "pay_1", 500, "broken")


if __name__ == "__main__":
    unittest.main()
EOF
