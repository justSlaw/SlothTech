<?php
header("Content-Type: application/json");

require "db.php";

$stmt = $db->query("SELECT * FROM items");
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($items as &$item) {
    $item["genres"] = json_decode($item["genres"]);
    $item["cast"] = json_decode($item["cast"]);
}

echo json_encode($items, JSON_UNESCAPED_UNICODE);
