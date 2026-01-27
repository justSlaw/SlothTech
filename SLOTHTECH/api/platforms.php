<?php
header("Content-Type: application/json");
require "db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM platforms ORDER BY platform");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $platform = trim($data['platform'] ?? '');
    $type = trim($data['type'] ?? '');
    if (!$platform) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Brak nazwy']); exit; }
    $stmt = $db->prepare("INSERT OR IGNORE INTO platforms (platform,type) VALUES (:platform,:type)");
    $stmt->execute([':platform'=>$platform,':type'=>$type]);
    echo json_encode(['success'=>true]);
    exit;
}

http_response_code(405);
echo json_encode(['success'=>false,'error'=>'Method not allowed']);
