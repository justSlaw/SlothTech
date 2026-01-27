<?php
header("Content-Type: application/json");
require "db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM genres ORDER BY genre");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $genre = trim($data['genre'] ?? '');
    if (!$genre) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak nazwy']);
        exit;
    }
    $stmt = $db->prepare("INSERT OR IGNORE INTO genres (genre) VALUES (:genre)");
    $stmt->execute([':genre' => $genre]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
