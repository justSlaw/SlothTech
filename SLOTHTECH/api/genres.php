<?php
header("Content-Type: application/json");
require "db.php";

$db->exec("CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    genre TEXT UNIQUE
)");

function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function normalizeStringArray(mixed $value): array {
    if (is_array($value)) return array_values($value);
    return [];
}

function updateItemsGenres(PDO $db, string $oldGenre, ?string $newGenre): void {
    $stmt = $db->query("SELECT id, genres FROM items");
    $items = $stmt->fetchAll();
    if (!$items) return;

    $update = $db->prepare("UPDATE items SET genres = :genres WHERE id = :id");

    foreach ($items as $item) {
        $genres = normalizeStringArray(json_decode($item['genres'] ?? '[]', true));

        $changed = false;
        $next = [];
        foreach ($genres as $g) {
            if (!is_string($g)) continue;
            if ($g === $oldGenre) {
                $changed = true;
                if ($newGenre !== null && $newGenre !== '') {
                    $next[] = $newGenre;
                }
            } else {
                $next[] = $g;
            }
        }

        // Unikaty, zachowując kolejność
        $dedup = [];
        $seen = [];
        foreach ($next as $g) {
            if (isset($seen[$g])) continue;
            $seen[$g] = true;
            $dedup[] = $g;
        }

        if ($changed) {
            $update->execute([
                ':genres' => json_encode($dedup, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ':id' => (int)$item['id'],
            ]);
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM genres ORDER BY genre");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = readJsonBody();
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

// Edycja gatunku (PUT/PATCH): /genres?id=123 {"genre":"Nowy"}
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $data = readJsonBody();
    $newGenre = trim($data['genre'] ?? '');

    if (!$id || $newGenre === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak id lub nazwy']);
        exit;
    }

    $stmt = $db->prepare('SELECT id, genre FROM genres WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nie znaleziono gatunku']);
        exit;
    }

    $oldGenre = (string)$existing['genre'];

    $stmt = $db->prepare('UPDATE genres SET genre = :genre WHERE id = :id');
    $stmt->execute([':genre' => $newGenre, ':id' => $id]);

    // Zaktualizuj referencje w items
    updateItemsGenres($db, $oldGenre, $newGenre);

    echo json_encode(['success' => true]);
    exit;
}

// Usuwanie gatunku (DELETE): /genres?id=123
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak id']);
        exit;
    }

    $stmt = $db->prepare('SELECT id, genre FROM genres WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nie znaleziono gatunku']);
        exit;
    }

    $oldGenre = (string)$existing['genre'];

    $stmt = $db->prepare('DELETE FROM genres WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // Usuń z items
    updateItemsGenres($db, $oldGenre, null);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
