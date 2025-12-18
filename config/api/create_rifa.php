<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
$name = isset($input['name']) ? trim($input['name']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$prize = isset($input['prize']) ? trim($input['prize']) : '';
$ticket_price = isset($input['ticket_price']) ? (float)$input['ticket_price'] : 0;
$total_tickets = isset($input['total_tickets']) ? (int)$input['total_tickets'] : 0;

if (empty($name) || empty($prize) || $ticket_price <= 0 || $total_tickets <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$response = ['success' => false, 'message' => 'No se pudo crear la rifa.'];

try {
    $pdo->beginTransaction();

    // Insert rifa
    $stmt = $pdo->prepare("INSERT INTO rifas_rifas (name, description, prize, ticket_price, total_tickets) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $description, $prize, $ticket_price, $total_tickets]);
    $rifa_id = $pdo->lastInsertId();

    // Insert boletos
    $stmt_boleto = $pdo->prepare("INSERT INTO rifas_boletos (rifa_id, number, status) VALUES (?, ?, 'available')");
    for ($i = 1; $i <= $total_tickets; $i++) {
        $stmt_boleto->execute([$rifa_id, $i]);
    }

    $pdo->commit();
    $response = ['success' => true, 'message' => 'Rifa creada exitosamente.', 'rifa_id' => $rifa_id];
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    $response['message'] = 'Error de base de datos: ' . $e->getMessage();
}

echo json_encode($response);
?>