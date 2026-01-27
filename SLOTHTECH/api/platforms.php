<?php
header("Content-Type: application/json");
require "db.php";

$db->exec("CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT,
    type TEXT,
    UNIQUE(platform, type)
)");

function readJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function normalizePlatforms(mixed $value): array {
    if (is_array($value)) return array_values($value);
    return [];
}

function updateItemsPlatforms(PDO $db, string $oldPlatform, string $oldType, ?string $newPlatform, ?string $newType): void {
    $stmt = $db->query("SELECT id, platforms FROM items");
    $items = $stmt->fetchAll();
    if (!$items) return;

    $update = $db->prepare("UPDATE items SET platforms = :platforms WHERE id = :id");

    foreach ($items as $item) {
        $platforms = normalizePlatforms(json_decode($item['platforms'] ?? '[]', true));
        $changed = false;
        $next = [];

        foreach ($platforms as $p) {
            // format 1: string
            if (is_string($p)) {
                if ($p === $oldPlatform) {
                    $changed = true;
                    if ($newPlatform !== null && $newPlatform !== '') {
                        $next[] = $newPlatform;
                    }
                } else {
                    $next[] = $p;
                }
                continue;
            }

            // format 2: obiekt/array
            if (is_array($p)) {
                $name = $p['name'] ?? ($p['platform'] ?? null);
                $type = $p['type'] ?? '';

                $matchesName = is_string($name) && $name === $oldPlatform;
                $matchesType = ($oldType === '') || ($type === $oldType);

                if ($matchesName && $matchesType) {
                    $changed = true;
                    if ($newPlatform !== null && $newPlatform !== '') {
                        $p['name'] = $newPlatform;
                        $p['platform'] = $newPlatform;
                        if ($newType !== null) {
                            $p['type'] = $newType;
                        }
                        // usuń duplikaty kluczy jeśli oba istnieją (zostawiamy oba dla kompatybilności)
                        $next[] = $p;
                    }
                } else {
                    $next[] = $p;
                }
            }
        }

        if ($changed) {
            $update->execute([
                ':platforms' => json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ':id' => (int)$item['id'],
            ]);
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM platforms ORDER BY platform");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'POST') {
    $data = readJsonBody();
    $platform = trim($data['platform'] ?? '');
    $type = trim($data['type'] ?? '');
    if (!$platform) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Brak nazwy']); exit; }
    $stmt = $db->prepare("INSERT OR IGNORE INTO platforms (platform,type) VALUES (:platform,:type)");
    $stmt->execute([':platform'=>$platform,':type'=>$type]);
    echo json_encode(['success'=>true]);
    exit;
}

// Edycja platformy (PUT/PATCH): /platforms?id=123 {"platform":"Nowa","type":"Nowy"}
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $data = readJsonBody();
    $newPlatform = trim($data['platform'] ?? '');
    $newType = isset($data['type']) ? trim((string)$data['type']) : '';

    if (!$id || $newPlatform === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak id lub nazwy']);
        exit;
    }

    $stmt = $db->prepare('SELECT id, platform, type FROM platforms WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nie znaleziono platformy']);
        exit;
    }

    $oldPlatform = (string)$existing['platform'];
    $oldType = (string)($existing['type'] ?? '');

    $stmt = $db->prepare('UPDATE platforms SET platform = :platform, type = :type WHERE id = :id');
    $stmt->execute([':platform' => $newPlatform, ':type' => $newType, ':id' => $id]);

    updateItemsPlatforms($db, $oldPlatform, $oldType, $newPlatform, $newType);
    echo json_encode(['success' => true]);
    exit;
}

// Usuwanie platformy (DELETE): /platforms?id=123
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Brak id']);
        exit;
    }

    $stmt = $db->prepare('SELECT id, platform, type FROM platforms WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Nie znaleziono platformy']);
        exit;
    }

    $oldPlatform = (string)$existing['platform'];
    $oldType = (string)($existing['type'] ?? '');

    $stmt = $db->prepare('DELETE FROM platforms WHERE id = :id');
    $stmt->execute([':id' => $id]);

    updateItemsPlatforms($db, $oldPlatform, $oldType, null, null);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success'=>false,'error'=>'Method not allowed']);
