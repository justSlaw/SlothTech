<?php
header("Content-Type: application/json");
require "db.php"; // Twoja baza PDO
// Tworzymy tabelę ulubionych, jeśli nie istnieje
$db->exec("CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    item_id INTEGER
)");
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
if ($method === 'POST') {
    $token = $data['token'] ?? null;
    $item_id = $data['item_id'] ?? null;
    if (!$token || !$item_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "msg" => "Brak tokena lub item_id"]);
        exit;
    }
    // Sprawdź czy już jest w ulubionych
    $stmt = $db->prepare("SELECT * FROM favorites WHERE token=:token AND item_id=:item_id");
    $stmt->execute([':token'=>$token, ':item_id'=>$item_id]);
    $exists = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($exists) {
        // Usuń z ulubionych
        $stmt = $db->prepare("DELETE FROM favorites WHERE token=:token AND item_id=:item_id");
        $stmt->execute([':token'=>$token, ':item_id'=>$item_id]);
        echo json_encode(["status"=>"removed"]);
    } else {
        // Dodaj do ulubionych
        $stmt = $db->prepare("INSERT INTO favorites (token, item_id) VALUES (:token, :item_id)");
        $stmt->execute([':token'=>$token, ':item_id'=>$item_id]);
        echo json_encode(["status"=>"added"]);
    }
} else if ($method === 'GET') {
    $token = $_GET['token'] ?? null;
    if (!$token) { echo json_encode([]); exit; }
    $stmt = $db->prepare("SELECT item_id FROM favorites WHERE token=:token");
    $stmt->execute([':token'=>$token]);
    $items = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($items);
}