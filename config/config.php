<?php
// Database configuration based on environment
$host = 'localhost';
$dbname = 'u809573533_todo';

// Check if running on production domain
$server_name = $_SERVER['SERVER_NAME'] ?? 'localhost';
$is_production = in_array($server_name, ['ezequielzanetti.com.ar', 'www.ezequielzanetti.com.ar']);

if ($is_production) {
    // Load production environment variables
    $env = parse_ini_file('.env');
    $user = $env['DB_USER'];
    $pass = $env['DB_PASS'];
} else {
    // Local development
    $user = 'root';
    $pass = '';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>