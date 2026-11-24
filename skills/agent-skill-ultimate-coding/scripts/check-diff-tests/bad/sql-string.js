const rows = await db.query(`SELECT * FROM orders WHERE id = ${orderId}`);
