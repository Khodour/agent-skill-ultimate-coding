#!/usr/bin/env bash
# Builds a small Python app whose docs show an OLD version of its exchange-rate
# library, while the version installed in the git-ignored virtual environment
# (pinned in requirements.txt) has a different API. Nothing in the visible project
# says the API changed: only the lock-style pin and the installed package do.
# Used by evals/repo-library-version/case.yaml: checks that the agent uses the
# installed version's API instead of the stale docs or its memory.
set -euo pipefail

SITE=.venv/lib/python3.12/site-packages
mkdir -p app "$SITE/ratekit" docs tests

printf '.venv/\n__pycache__/\n' > .gitignore

cat > README.md <<'EOF'
# shop-fx

Currency helpers for the shop.

Run the tests: `python3 -m unittest`
EOF

cat > requirements.txt <<'EOF'
ratekit==3.1.0
EOF

cat > "$SITE/ratekit/__init__.py" <<'EOF'
"""ratekit 3: live exchange rates.

Usage:
    client = Client(api_key)
    rate = client.rate(base="USD", quote="EUR", deadline_ms=2000)   # Decimal
"""
from decimal import Decimal

__version__ = "3.1.0"


class RateUnavailable(Exception):
    """The provider could not return a rate in time."""


class Client:
    """Talks to the rates provider. Pass a transport in tests."""

    def __init__(self, api_key: str, *, transport=None):
        self._api_key = api_key
        self._transport = transport

    def rate(self, base: str, quote: str, *, deadline_ms: int = 2000) -> Decimal:
        """Rate for 1 unit of base in quote currency, as a Decimal."""
        if self._transport is None:
            raise RateUnavailable("no network in this environment")
        return Decimal(str(self._transport(base, quote, deadline_ms)))
EOF

cat > app/__init__.py <<'EOF'
"""shop-fx app package. Makes the project's virtual environment importable when
the tests are run with the system Python."""
import glob
import os
import sys

_root = os.path.dirname(os.path.dirname(__file__))
for _site in glob.glob(os.path.join(_root, ".venv", "lib", "python3*", "site-packages")):
    sys.path.insert(0, _site)
EOF

cat > app/settings.py <<'EOF'
"""Settings read from the environment."""
import os

RATEKIT_API_KEY = os.environ.get("RATEKIT_API_KEY", "")
EOF

cat > docs/integrations.md <<'EOF'
# Integrations

## Exchange rates (ratekit)

```python
from ratekit import get_rate

rate = get_rate("USD", "EUR", timeout=5)   # float
```
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_settings.py <<'EOF'
"""Smoke test: the app package imports."""
import unittest

import app.settings


class SettingsTest(unittest.TestCase):
    def test_key_is_a_string(self):
        self.assertIsInstance(app.settings.RATEKIT_API_KEY, str)


if __name__ == "__main__":
    unittest.main()
EOF
