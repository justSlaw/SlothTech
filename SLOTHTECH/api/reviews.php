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

// tabela do śledzenia like/dislike
$db->exec("
    CREATE TABLE IF NOT EXISTS review_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER,
        user_ip TEXT,
        type TEXT CHECK(type IN ('like', 'dislike')),
        UNIQUE(review_id, user_ip)
    )
");

$method = $_SERVER['REQUEST_METHOD'];

// ===== DODAWANIE RECENZJI =====
if ($method === 'POST' && !isset($_GET['action'])) {
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
    
    // FILTR 1: Blacklista obraźliwych słów
    $blacklist = ['kurwa','chuj','debil','idiota','pizda','cwel','nigger'];
    
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
    
    // FILTR 2: Za krótkie recenzje (jeśli user wpisał tekst)
    if ($text !== '' && strlen($text) < 3) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Recenzja jest za krótka (min. 3 znaków)"
        ]);
        exit;
    }
    
    // FILTR 3: Za długie recenzje (spam)
    if (strlen($text) > 1000) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Recenzja jest za długa (max. 1000 znaków)"
        ]);
        exit;
    }
    
    // FILTR 4: Powtarzające się znaki (spam typu "aaaaaaa")
    if (preg_match('/(.)\1{9,}/', $text)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Recenzja zawiera zbyt wiele powtarzających się znaków"
        ]);
        exit;
    }
    
    
    
    $stmt = $db->prepare("
        INSERT INTO reviews (item_id, rating, text, date)
        VALUES (:item_id, :rating, :text, :date)
    ");
    
    $stmt->execute([
        ':item_id' => (int)$data['item_id'],
        ':rating' => (int)$data['rating'],
        ':text' => $text,
        ':date' => date('Y-m-d H:i:s')
    ]);
    
    $reviewId = $db->lastInsertId();
    
    echo json_encode([
        "success" => true,
        "reviewId" => $reviewId
    ]);
    exit;
}

// ===== LIKE/DISLIKE =====
else if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'like') {
    error_log("Like/Dislike request received: " . file_get_contents("php://input"));
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['review_id']) || !isset($data['type'])) {
        error_log("Missing review_id or type");
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Brak danych"]);
        exit;
    }
    
    error_log("Review ID: " . $data['review_id'] . ", Type: " . $data['type']);
    
    $user_ip = $_SERVER['REMOTE_ADDR'];
    
    // Sprawdź czy już głosował
    $stmt = $db->prepare("SELECT * FROM review_likes WHERE review_id = ? AND user_ip = ?");
    $stmt->execute([$data['review_id'], $user_ip]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        if ($existing['type'] === $data['type']) {
            // Usuń głos jeśli kliknięto ponownie
            $stmt = $db->prepare("DELETE FROM review_likes WHERE review_id = ? AND user_ip = ?");
            $stmt->execute([$data['review_id'], $user_ip]);
        } else {
            // Zmień głos
            $stmt = $db->prepare("UPDATE review_likes SET type = ? WHERE review_id = ? AND user_ip = ?");
            $stmt->execute([$data['type'], $data['review_id'], $user_ip]);
        }
    } else {
        // Dodaj nowy głos
        $stmt = $db->prepare("INSERT INTO review_likes (review_id, user_ip, type) VALUES (?, ?, ?)");
        $stmt->execute([$data['review_id'], $user_ip, $data['type']]);
    }
    
    echo json_encode(["success" => true]);
    exit;
}

// ===== POBRANIE STATYSTYK =====
else if ($method === 'GET' && isset($_GET['stats']) && isset($_GET['item_id'])) {
    $item_id = (int)$_GET['item_id'];
    $user_ip = $_SERVER['REMOTE_ADDR'];
    
    $stmt = $db->prepare("
        SELECT COUNT(*) as count, AVG(rating) as average 
        FROM reviews 
        WHERE item_id = :item_id
    ");
    $stmt->execute([':item_id' => $item_id]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Pobierz też liczbę like/dislike dla każdej recenzji oraz info czy użytkownik już głosował
    $stmt = $db->prepare("
        SELECT 
            r.id,
            COUNT(CASE WHEN rl.type = 'like' THEN 1 END) as likes,
            COUNT(CASE WHEN rl.type = 'dislike' THEN 1 END) as dislikes,
            MAX(CASE WHEN rl.user_ip = ? AND rl.type = 'like' THEN 1 ELSE 0 END) as user_liked,
            MAX(CASE WHEN rl.user_ip = ? AND rl.type = 'dislike' THEN 1 ELSE 0 END) as user_disliked
        FROM reviews r
        LEFT JOIN review_likes rl ON r.id = rl.review_id
        WHERE r.item_id = ?
        GROUP BY r.id
        ORDER BY r.id DESC
    ");
    $stmt->execute([$user_ip, $user_ip, $item_id]);
    $likesData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'count' => (int)($stats['count'] ?? 0),
        'average' => round($stats['average'] ?? 0, 1),
        'likesData' => $likesData
    ]);
    exit;
}

// ===== POBRANIE RECENZJI =====
else if ($method === 'GET') {
    $item_id = isset($_GET['item_id']) ? (int)$_GET['item_id'] : 0;
    $user_ip = $_SERVER['REMOTE_ADDR'];
    
    if (!$item_id) {
        echo json_encode([]);
        exit;
    }
    
    // Pobierz recenzje razem z informacją o like/dislike użytkownika
    $stmt = $db->prepare("
        SELECT 
            r.*,
            MAX(CASE WHEN rl.user_ip = ? AND rl.type = 'like' THEN 1 ELSE 0 END) as user_liked,
            MAX(CASE WHEN rl.user_ip = ? AND rl.type = 'dislike' THEN 1 ELSE 0 END) as user_disliked
        FROM reviews r
        LEFT JOIN review_likes rl ON r.id = rl.review_id
        WHERE r.item_id = ?
        GROUP BY r.id
        ORDER BY r.id DESC
    ");
    $stmt->execute([$user_ip, $user_ip, $item_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($reviews, JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== USUWANIE RECENZJI (ADMIN) =====
else if ($method === 'DELETE') {
    $review_id = isset($_GET['review_id']) ? (int)$_GET['review_id'] : 0;
    
    if (!$review_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Brak ID recenzji"]);
        exit;
    }
    
    // Usuń recenzję
    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([$review_id]);
    
    // Usuń też like/dislike dla tej recenzji
    $stmt = $db->prepare("DELETE FROM review_likes WHERE review_id = ?");
    $stmt->execute([$review_id]);
    
    echo json_encode(["success" => true]);
    exit;
}

// ===== INNE METODY =====
else {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Method not allowed"
    ]);
    exit;
}