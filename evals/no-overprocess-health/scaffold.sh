#!/usr/bin/env bash
# A tiny Python service with a route table. The task (a health endpoint) is small and
# safe; the test is that the skill does not pile process onto it: no rate limiter, no
# auth, no long report. Used by evals/no-overprocess-health.
set -euo pipefail
mkdir -p app tests
cat > app/__init__.py <<'EOF'
"""The service."""
EOF
cat > app/routes.py <<'EOF'
"""Maps paths to handlers. Each handler takes the request dict and returns (status, body)."""


def get_version(request: dict) -> tuple[int, dict]:
    """The running version, for the deploy dashboard."""
    return 200, {"version": "1.4.2"}


ROUTES = {
    "/version": get_version,
}
EOF
cat > tests/__init__.py <<'EOF'
EOF
cat > tests/test_routes.py <<'EOF'
"""Tests for app.routes."""
import unittest

from app.routes import ROUTES


class RoutesTest(unittest.TestCase):
    def test_version(self):
        self.assertEqual(ROUTES["/version"]({}), (200, {"version": "1.4.2"}))


if __name__ == "__main__":
    unittest.main()
EOF
