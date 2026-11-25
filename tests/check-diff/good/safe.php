<?php
/** Safe PHP: placeholders and bound values. */
$n = (int) $db->one("SELECT COUNT(*) FROM orders WHERE customer_id = ? AND status = 'paid'", [$customerId]);
$db->prepare("UPDATE coupons SET used_by = ?, updated_at = ? WHERE code = ?")->execute([$customerId, $now, $code]);
$pdo->exec($migrationSql);
