<?php
$db = new PDO('sqlite:database\data.db');
$db->exec("ALTER TABLE items ADD COLUMN poster TEXT;");
echo "Kolumna poster dodana!";
?>
