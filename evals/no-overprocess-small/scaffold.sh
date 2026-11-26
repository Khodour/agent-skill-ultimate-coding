#!/usr/bin/env bash
# A small text helper module. The task is a Small one (one pure function); the test
# is that the skill stays light: few reference files read, and a short report.
# Used by evals/no-overprocess-small.
set -euo pipefail
mkdir -p tests
cat > text_utils.py <<'EOF'
"""Small text helpers shared by the site."""


def truncate(text: str, limit: int) -> str:
    """Cuts text to at most `limit` characters, ending with "…" when it was cut."""
    if limit < 1:
        raise ValueError("limit must be at least 1")
    return text if len(text) <= limit else text[: limit - 1] + "…"
EOF
cat > tests/__init__.py <<'EOF'
EOF
cat > tests/test_text_utils.py <<'EOF'
"""Tests for text_utils."""
import unittest

from text_utils import truncate


class TruncateTest(unittest.TestCase):
    def test_short_text_is_kept(self):
        self.assertEqual(truncate("hi", 5), "hi")

    def test_long_text_is_cut(self):
        self.assertEqual(truncate("hello world", 6), "hello…")


if __name__ == "__main__":
    unittest.main()
EOF
