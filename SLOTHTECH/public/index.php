<?php
// Front Controller



// Pobierz ścieżkę z URL
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);


$path = str_replace('/public', '', $path);
$route = trim($path, '/');

// Router
switch ($route) {
    case '':
    case 'home':
        require_once __DIR__ . '/index.html';
        break;
    
    case 'api/items':
        require_once __DIR__ . '/../api/items.php';
        break;
    
    case 'api/reviews':
        require_once __DIR__ . '/../api/reviews.php';
        break;
    
    case 'api/favorites':
        require_once __DIR__ . '/../api/favorites.php';
        break;
    
    case 'admin':
        require_once __DIR__ . '/admin.html';
        break;
    
    case 'admin-login':
        require_once __DIR__ . '/admin-login.html';
        break;
    
    default:
    
        $file = __DIR__ . '/' . $route;
        
        if (file_exists($file) && is_file($file)) {
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            $mimeTypes = [
                'css' => 'text/css',
                'js' => 'application/javascript',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
            ];
            
            if (isset($mimeTypes[$ext])) {
                header('Content-Type: ' . $mimeTypes[$ext]);
            }
            
            readfile($file);
            exit;
        }
        
        // 404
        http_response_code(404);
        
        break;
}