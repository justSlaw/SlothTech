<?php
header("Content-Type: application/json");

require "db.php";

function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonDecodeArray(?string $raw): array {
    if ($raw === null || $raw === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function normalizeGenres(mixed $value): array {
    if (!is_array($value)) return [];
    $out = [];
    $seen = [];
    foreach ($value as $g) {
        if (!is_string($g)) continue;
        $g = trim($g);
        if ($g === '') continue;
        if (isset($seen[$g])) continue;
        $seen[$g] = true;
        $out[] = $g;
    }
    return $out;
}

function normalizePlatforms(mixed $value): array {
    if (!is_array($value)) return [];
    $out = [];
    $seen = [];
    foreach ($value as $p) {
        $name = null;
        $type = '';

        if (is_string($p)) {
            $name = trim($p);
        } elseif (is_array($p)) {
            $name = $p['name'] ?? ($p['platform'] ?? null);
            $type = isset($p['type']) ? trim((string)$p['type']) : '';
            if (is_string($name)) $name = trim($name);
        }

        if (!is_string($name) || $name === '') continue;

        $key = $name . "\n" . $type;
        if (isset($seen[$key])) continue;
        $seen[$key] = true;

        $out[] = ['name' => $name, 'type' => $type];
    }
    return $out;
}

function hydrateItem(array $item): array {
    $item['genres'] = jsonDecodeArray($item['genres'] ?? null);
    $item['cast'] = jsonDecodeArray($item['cast'] ?? null);
    $item['platforms'] = jsonDecodeArray($item['platforms'] ?? null);
    return $item;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $type = isset($_GET['type']) ? trim((string)$_GET['type']) : '';

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM items WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$item) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Nie znaleziono elementu']);
            exit;
        }
        echo json_encode(hydrateItem($item), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($type !== '') {
        $stmt = $db->prepare('SELECT * FROM items WHERE type = :type');
        $stmt->execute([':type' => $type]);
    } else {
        $stmt = $db->query('SELECT * FROM items');
    }

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($items as &$item) {
        $item = hydrateItem($item);
    }
    echo json_encode($items, JSON_UNESCAPED_UNICODE);
    exit;
}if ($method === 'POST') {
    $data = readJsonBody();

    $type = $data['type'] ?? '';
    $title = trim($data['title'] ?? '');
    $year = (int)($data['year'] ?? 0);
    $rating = floatval($data['rating'] ?? 0);
    $genres = json_encode(normalizeGenres($data['genres'] ?? []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $cast = json_encode($data['cast'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $director = trim($data['director'] ?? '');
    $platforms = json_encode(normalizePlatforms($data['platforms'] ?? []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $duration = trim($data['duration'] ?? '');
    $poster = trim($data['poster'] ?? '');
    if (!$type || !$title || !$year) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak wymaganych danych']);
        exit;
    }

    $stmt = $db->prepare('INSERT INTO items (type, title, year, rating, genres, cast, platforms, director, duration, poster) 
                        VALUES (:type, :title, :year, :rating, :genres, :cast, :platforms, :director, :duration, :poster)');
    $stmt->execute([
        ':type' => $type,
        ':title' => $title,
        ':year' => $year,
        ':rating' => $rating,
        ':genres' => $genres,
        ':cast' => $cast,
        ':platforms' => $platforms,
        ':director' => $director,
        ':duration' => $duration,
        ':poster' => $poster
    ]);

    echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    exit;
}


if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $data = readJsonBody();
    if (!$id && isset($data['id'])) $id = (int)$data['id'];

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak id']);
        exit;
    }

    $stmt = $db->prepare('SELECT id FROM items WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nie znaleziono elementu']);
        exit;
    }

    $fields = [];
    $params = [':id' => $id];

    // DODAJ obsługę description
    if (array_key_exists('description', $data)) {
        $fields[] = 'description = :description';
        $params[':description'] = trim($data['description']);
    }

    if (array_key_exists('genres', $data)) {
        $genres = normalizeGenres($data['genres']);
        $fields[] = 'genres = :genres';
        $params[':genres'] = json_encode($genres, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    if (array_key_exists('platforms', $data)) {
        $platforms = normalizePlatforms($data['platforms']);
        $fields[] = 'platforms = :platforms';
        $params[':platforms'] = json_encode($platforms, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    if (!$fields) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak danych do aktualizacji']);
        exit;
    }

    $sql = 'UPDATE items SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
