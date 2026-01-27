<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "Brak ID"]);
    exit;
}

$stmt = $db->prepare("DELETE FROM items WHERE id = :id");
$stmt->bindValue(":id", $id, PDO::PARAM_INT);
$stmt->execute();

echo json_encode(["success" => true]);