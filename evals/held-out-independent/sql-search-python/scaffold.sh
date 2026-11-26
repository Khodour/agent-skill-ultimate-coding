#!/usr/bin/env bash
# Builds a small orders back-office tool (Python 3 stdlib, sqlite3, unittest).
set -euo pipefail

mkdir -p orders_app tests

cat > README.md <<'EOF'
# orders back office

Support tool over the orders database (SQLite).

    python3 -m orders_app.cli --db orders.db show 1
    python3 -m orders_app.cli --db orders.db customer 2

Run the tests:

    python3 -m unittest discover -s tests
EOF

cat > orders_app/__init__.py <<'EOF'
EOF

cat > orders_app/db.py <<'EOF'
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL
);
"""


def connect(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn
EOF

cat > orders_app/orders.py <<'EOF'
"""Read-only queries used by the support tool."""

ORDER_COLUMNS = "o.id, o.total_cents, o.status, c.name AS customer_name, c.email AS customer_email"


def get_order(conn, order_id):
    sql = (
        "SELECT " + ORDER_COLUMNS + " FROM orders o "
        "JOIN customers c ON c.id = o.customer_id "
        "WHERE o.id = %d" % int(order_id)
    )
    row = conn.execute(sql).fetchone()
    return dict(row) if row else None


def orders_for_customer(conn, customer_id):
    sql = (
        "SELECT " + ORDER_COLUMNS + " FROM orders o "
        "JOIN customers c ON c.id = o.customer_id "
        "WHERE o.customer_id = %d ORDER BY o.id" % int(customer_id)
    )
    return [dict(row) for row in conn.execute(sql).fetchall()]
EOF

cat > orders_app/cli.py <<'EOF'
import argparse
import json
import sys

from . import db, orders


def main(argv=None):
    parser = argparse.ArgumentParser(prog="orders")
    parser.add_argument("--db", default="orders.db")
    sub = parser.add_subparsers(dest="command", required=True)

    show = sub.add_parser("show", help="show one order")
    show.add_argument("order_id", type=int)

    customer = sub.add_parser("customer", help="list a customer's orders")
    customer.add_argument("customer_id", type=int)

    args = parser.parse_args(argv)
    conn = db.connect(args.db)

    if args.command == "show":
        result = orders.get_order(conn, args.order_id)
    else:
        result = orders.orders_for_customer(conn, args.customer_id)

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
EOF

cat > tests/__init__.py <<'EOF'
EOF

cat > tests/test_orders.py <<'EOF'
import unittest

from orders_app import db, orders


def seeded_connection():
    conn = db.connect(":memory:")
    conn.executemany(
        "INSERT INTO customers (id, name, email) VALUES (?, ?, ?)",
        [
            (1, "Maria Lopez", "maria.lopez@example.com"),
            (2, "Sam O'Neil", "sam.oneil@example.org"),
        ],
    )
    conn.executemany(
        "INSERT INTO orders (id, customer_id, total_cents, status) VALUES (?, ?, ?, ?)",
        [(10, 1, 2599, "paid"), (11, 1, 1000, "refunded"), (12, 2, 45000, "paid")],
    )
    return conn


class OrdersTest(unittest.TestCase):
    def setUp(self):
        self.conn = seeded_connection()

    def test_get_order(self):
        order = orders.get_order(self.conn, 12)
        self.assertEqual(order["customer_email"], "sam.oneil@example.org")
        self.assertEqual(order["total_cents"], 45000)

    def test_get_missing_order(self):
        self.assertIsNone(orders.get_order(self.conn, 999))

    def test_orders_for_customer(self):
        ids = [o["id"] for o in orders.orders_for_customer(self.conn, 1)]
        self.assertEqual(ids, [10, 11])


if __name__ == "__main__":
    unittest.main()
EOF
