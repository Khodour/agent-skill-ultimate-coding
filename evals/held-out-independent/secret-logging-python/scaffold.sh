#!/usr/bin/env bash
# Builds a small CRM API client library (Python 3 stdlib: urllib, logging, unittest).
set -euo pipefail

mkdir -p crm tests

cat > README.md <<'EOF'
# crm-client

Thin client for the CRM REST API. The API key comes from the CRM_API_KEY environment variable.

    from crm.config import client_from_env
    client = client_from_env()
    client.create_contact(email="a@example.com", name="A")

Run the tests:

    python3 -m unittest discover -s tests
EOF

cat > crm/__init__.py <<'EOF'
EOF

cat > crm/config.py <<'EOF'
import os

from .client import CrmClient

DEFAULT_BASE_URL = "https://api.crm.example.com/v2"


def client_from_env():
    api_key = os.environ["CRM_API_KEY"]
    base_url = os.environ.get("CRM_BASE_URL", DEFAULT_BASE_URL)
    return CrmClient(base_url, api_key)
EOF

cat > crm/logging_setup.py <<'EOF'
import logging
import os


def configure():
    """Called once at process start by the services that use this client."""
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
EOF

cat > crm/client.py <<'EOF'
import json
import urllib.error
import urllib.request


class CrmError(Exception):
    def __init__(self, status, message):
        super().__init__(f"CRM API error {status}: {message}")
        self.status = status


class CrmClient:
    def __init__(self, base_url, api_key, opener=None, timeout=10):
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._opener = opener or urllib.request.build_opener()
        self._timeout = timeout

    def get_contact(self, contact_id):
        return self._request("GET", f"/contacts/{int(contact_id)}")

    def create_contact(self, email, name, phone=None):
        return self._request("POST", "/contacts", {"email": email, "name": name, "phone": phone})

    def _request(self, method, path, body=None):
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(self._base_url + path, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self._api_key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        try:
            with self._opener.open(req, timeout=self._timeout) as resp:
                raw = resp.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as err:
            raise CrmError(err.code, err.read().decode("utf-8", errors="replace")) from err
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_client.py <<'EOF'
import io
import json
import unittest
import urllib.error

from crm.client import CrmClient, CrmError


class FakeResponse(io.BytesIO):
    status = 200


class FakeOpener:
    def __init__(self, status=200, payload=None):
        self.status = status
        self.payload = payload
        self.requests = []

    def open(self, req, timeout=None):
        self.requests.append(req)
        body = json.dumps(self.payload).encode("utf-8")
        if self.status >= 400:
            raise urllib.error.HTTPError(req.full_url, self.status, "error", {}, io.BytesIO(body))
        return FakeResponse(body)


class CrmClientTest(unittest.TestCase):
    def test_get_contact(self):
        opener = FakeOpener(payload={"id": 7, "name": "Lee"})
        client = CrmClient("https://crm.test/v2", "test-key-not-real", opener=opener)
        self.assertEqual(client.get_contact(7), {"id": 7, "name": "Lee"})
        self.assertEqual(opener.requests[0].full_url, "https://crm.test/v2/contacts/7")

    def test_sends_bearer_key(self):
        opener = FakeOpener(payload={"id": 1})
        client = CrmClient("https://crm.test/v2", "test-key-not-real", opener=opener)
        client.create_contact("lee@example.com", "Lee")
        self.assertEqual(opener.requests[0].get_header("Authorization"), "Bearer test-key-not-real")

    def test_http_error_raises(self):
        opener = FakeOpener(status=503, payload={"error": "unavailable"})
        client = CrmClient("https://crm.test/v2", "test-key-not-real", opener=opener)
        with self.assertRaises(CrmError) as ctx:
            client.get_contact(1)
        self.assertEqual(ctx.exception.status, 503)


if __name__ == "__main__":
    unittest.main()
EOF
