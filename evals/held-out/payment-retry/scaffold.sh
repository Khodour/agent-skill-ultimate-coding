#!/usr/bin/env bash
# Builds a small Python payments module that charges a card through a provider's HTTP API.
# Used by evals/held-out/payment-retry/case.yaml: adding retries must not charge twice.
set -euo pipefail

mkdir -p payments tests

cat > README.md <<'EOF'
# payments

Charges orders through the payment provider. Run the tests: `python3 -m unittest`

## Provider API notes

- `POST https://api.pay.example/charges` with JSON `{"amount_cents": int, "order_id": str}`.
- Returns 201 with `{"charge_id": str}`.
- 4xx means the request is wrong (bad card, bad amount): retrying will not help.
- 5xx or a timeout means the outcome is unknown: the charge may or may not have been made.
- Send an `Idempotency-Key` header to make a request safe to repeat: the provider
  returns the first result for a repeated key instead of charging again.
EOF

cat > payments/__init__.py <<'EOF'
"""Payments package."""
EOF

cat > payments/http.py <<'EOF'
"""Thin HTTP helper used by the payments client. Tests replace post() with a fake."""
import json
import urllib.error
import urllib.request


class HttpError(Exception):
    """Raised for a non-2xx response; status holds the HTTP status code."""

    def __init__(self, status: int):
        super().__init__(f"HTTP {status}")
        self.status = status


def post(url: str, body: dict, headers: dict | None = None, timeout: float | None = None) -> dict:
    """POST JSON and return the decoded JSON response.

    Raises HttpError for a non-2xx status, TimeoutError when the timeout passes,
    and ConnectionError when the server cannot be reached.
    """
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read())
    # HTTPError is a subclass of URLError, so it must be caught first.
    except urllib.error.HTTPError as error:
        raise HttpError(error.code) from error
    except urllib.error.URLError as error:
        if isinstance(error.reason, TimeoutError):
            raise TimeoutError(str(error.reason)) from error
        raise ConnectionError(str(error.reason)) from error
EOF

cat > payments/client.py <<'EOF'
"""Charges an order through the payment provider. Called once per checkout."""
from payments import http

CHARGES_URL = "https://api.pay.example/charges"


def charge(order_id: str, amount_cents: int) -> str:
    """Charge the order and return the provider's charge id."""
    response = http.post(CHARGES_URL, {"amount_cents": amount_cents, "order_id": order_id})
    return response["charge_id"]
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_client.py <<'EOF'
"""Tests for payments.client, with the HTTP call replaced by a fake."""
import unittest
from unittest import mock

from payments import client


class ChargeTest(unittest.TestCase):
    def test_returns_charge_id(self):
        with mock.patch("payments.http.post", return_value={"charge_id": "ch_1"}):
            self.assertEqual(client.charge("o1", 500), "ch_1")


if __name__ == "__main__":
    unittest.main()
EOF
