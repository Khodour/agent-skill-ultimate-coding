<?php
/** Safe PHP: placeholders and bound values. */
$n = (int) $db->one("SELECT COUNT(*) FROM loyalty_notice WHERE cid = ? AND type = 'level_up'", [$cid]);
$db->prepare("UPDATE referral SET inviter = ?, updated_at = ? WHERE cid = ?")->execute([$k, $now, $cid]);
$pdo->exec($migrationSql);
