<?php
header("Content-Type: application/json");
require "db.php";

// Tworzymy tabelę recenzji jeśli nie istnieje
$db->exec("
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        rating INTEGER,
        text TEXT,
        date TEXT
    )
");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Dodawanie recenzji
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['item_id']) || !isset($data['rating'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Brak danych"
        ]);

        exit;
    }
        $text = trim($data['text'] ?? '');

    $blacklist = ['kurwa','chuj','debil','idiota','pizda','cwel','nigger'
    ];

    foreach ($blacklist as $bad) {
        if (stripos($text, $bad) !== false) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "Recenzja zawiera niedozwolone słowa"
            ]);
            exit;
        }
    }

    $stmt = $db->prepare("
        INSERT INTO reviews (item_id, rating, text, date)
        VALUES (:item_id, :rating, :text, :date)
    ");
    $stmt->execute([
        ':item_id' => (int)$data['item_id'],
        ':rating'  => (int)$data['rating'],
        ':text'    => isset($data['text']) ? $data['text'] : '',
        ':date'    => date('Y-m-d H:i:s')
    ]);

    echo json_encode(["success" => true]);

} else if ($method === 'GET') {
    // Pobieranie recenzji dla danego filmu/serialu
    $item_id = isset($_GET['item_id']) ? (int)$_GET['item_id'] : 0;
    if (!$item_id) {
        echo json_encode([]);
        exit;
    }

    $stmt = $db->prepare("
        SELECT * FROM reviews
        WHERE item_id = :item_id
        ORDER BY id DESC
    ");
    $stmt->execute([':item_id' => $item_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reviews, JSON_UNESCAPED_UNICODE);

} else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Method not allowed"
    ]);

}
