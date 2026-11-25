"""Orders: safe versions of the patterns check-diff looks for."""
import os
import secrets
from decimal import Decimal

API_KEY = os.environ["PAYMENTS_API_KEY"]


def find_user(db, name):
    """Parameterized query: the name is data, never SQL."""
    return db.execute("SELECT * FROM users WHERE name = %s", (name,))


def customers_for(orders):
    """One query for every customer instead of one per order."""
    ids = [o.customer_id for o in orders]
    by_id = {c.id: c for c in Customer.objects.filter(id__in=ids)}
    for order in orders:
        yield by_id[order.customer_id].name


def charge(order):
    """Log and re-raise, never swallow."""
    try:
        return gateway.charge(order.id, order.total_cents)
    except GatewayError:
        log.exception("charge failed for order %s", order.id)
        raise


def new_reset_token():
    """Secure random for anything secret."""
    return secrets.token_urlsafe(32)


def split(total_cents, people):
    """Exact shares in integer cents."""
    base, extra = divmod(total_cents, people)
    return [base + (1 if i < extra else 0) for i in range(people)]


PRICE = Decimal("19.99")
# Totals are kept in integer cents so they always add up.
