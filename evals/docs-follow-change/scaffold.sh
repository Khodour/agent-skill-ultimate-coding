#!/usr/bin/env bash
# Builds a small command-line tool whose options are documented in two places: a
# short README and a full option reference in docs/reference.md. The task adds an
# option; the test is whether both documents follow. Used by evals/docs-follow-change.
set -euo pipefail
mkdir -p fetcher tests docs

cat > fetcher/__init__.py <<'EOF'
"""A small URL fetcher."""
EOF

cat > fetcher/cli.py <<'EOF'
"""Command line: fetcher <url> [--retries N] [--quiet]."""
import argparse
import sys
import urllib.request


def build_parser() -> argparse.ArgumentParser:
    """The command's options."""
    p = argparse.ArgumentParser(prog="fetcher", description="Download a URL and print it.")
    p.add_argument("url")
    p.add_argument("--retries", type=int, default=2, help="extra attempts after a failure (default 2)")
    p.add_argument("--quiet", action="store_true", help="print nothing but the body")
    return p


def fetch(url: str, retries: int) -> bytes:
    """Downloads the URL, trying again up to `retries` times."""
    last = None
    for _ in range(retries + 1):
        try:
            with urllib.request.urlopen(url) as r:
                return r.read()
        except OSError as e:
            last = e
    raise last


def main(argv=None) -> int:
    """Runs the command; returns the exit code."""
    args = build_parser().parse_args(argv)
    body = fetch(args.url, args.retries)
    sys.stdout.write(body.decode("utf-8", "replace"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
EOF

cat > tests/__init__.py <<'EOF'
EOF
cat > tests/test_cli.py <<'EOF'
"""Tests for fetcher.cli."""
import unittest

from fetcher.cli import build_parser


class ParserTest(unittest.TestCase):
    def test_defaults(self):
        a = build_parser().parse_args(["https://example.invalid"])
        self.assertEqual((a.retries, a.quiet), (2, False))


if __name__ == "__main__":
    unittest.main()
EOF

cat > README.md <<'EOF'
# fetcher

Download a URL and print it.

    python3 -m fetcher.cli https://example.invalid --retries 3

Every option is listed in [docs/reference.md](docs/reference.md).
EOF

cat > docs/reference.md <<'EOF'
# Option reference

| Option | Default | What it does |
|---|---|---|
| `url` | (required) | The address to download. |
| `--retries N` | 2 | Extra attempts after a failure. |
| `--quiet` | off | Print nothing but the body. |
EOF
