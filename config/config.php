<?php
// Database configuration
$host = 'localhost'; // Change to your host
$user = 'root'; // Change to your username
$pass = ''; // Change to your password
$dbname = 'u809573533_todo';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>