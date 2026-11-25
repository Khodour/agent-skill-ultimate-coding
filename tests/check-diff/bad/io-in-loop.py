for order in orders:
    customer = Customer.objects.get(id=order.customer_id)
    lines.append(customer.name)
