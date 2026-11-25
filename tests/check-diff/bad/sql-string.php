<?php
$row = $db->selectOne("SELECT status FROM invoice WHERE invid = '" . $invid . "'");
$all = $db->query("SELECT * FROM client WHERE name = '$name'");
