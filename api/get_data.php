<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate'); // Ensure client gets fresh data

$json_file = '../data.json';

if (file_exists($json_file)) {
    echo file_get_contents($json_file);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Data file not found.']);
}
?>
