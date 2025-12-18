<?php
header('Content-Type: application/json');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : 0;
$name = isset($input['name']) ? trim($input['name']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$prize = isset($input['prize']) ? trim($input['prize']) : '';
$ticket_price = isset($input['ticket_price']) ? (float)$input['ticket_price'] : 0;

if (!$id || empty($name) || empty($prize) || $ticket_price <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE rifas_rifas SET name = ?, description = ?, prize = ?, ticket_price = ? WHERE id = ?");
    $stmt->execute([$name, $description, $prize, $ticket_price, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Rifa actualizada exitosamente.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se encontraron cambios o rifa no existe.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>