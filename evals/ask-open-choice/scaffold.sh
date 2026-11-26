#!/usr/bin/env bash
# Builds a tiny shop with orders and one existing clean-up job. The prompt asks
# for a new job but leaves two values blank ("X status", "X days"): the agent
# has to ask for them before it builds. Used by evals/ask-open-choice.
set -euo pipefail
mkdir -p shop jobs tests

cat > README.md <<'EOF'
# shop

Back office. Jobs in `jobs/` run every night. Run the tests: `python3 -m unittest`
EOF

cat > shop/__init__.py <<'EOF'
"""Shop back office."""
EOF

cat > shop/models.py <<'EOF'
"""Orders as the back office stores them."""
from dataclasses import dataclass
from datetime import datetime

STATUSES = ("draft", "waiting_payment", "paid", "packed", "shipped", "delivered", "cancelled")


@dataclass
class Order:
    """A customer's order; status is one of STATUSES, created_at is a UTC datetime."""
    id: int
    customer: str
    status: str
    created_at: datetime
EOF

cat > jobs/__init__.py <<'EOF'
"""Nightly jobs."""
EOF

cat > jobs/expire_sessions.py <<'EOF'
"""Nightly job: sign-in sessions older than 30 days are removed."""
from datetime import datetime, timedelta, timezone

MAX_AGE_DAYS = 30


def expired(sessions, now=None):
    """The sessions to remove: last used more than MAX_AGE_DAYS ago."""
    now = now or datetime.now(timezone.utc)
    return [s for s in sessions if now - s.last_used > timedelta(days=MAX_AGE_DAYS)]
EOF

cat > tests/__init__.py <<'EOF'
EOF
