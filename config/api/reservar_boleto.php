<?php
header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

require_once '../config.php';

// Get the incoming data
$input = json_decode(file_get_contents('php://input'), true);
$ticket_number = isset($input['number']) ? (int)$input['number'] : 0;
$rifa_id = isset($input['rifa_id']) ? (int)$input['rifa_id'] : 1;

if ($ticket_number <= 0 || $rifa_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$response = ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];

try {

    // Start transaction
    $pdo->beginTransaction();

    // Check if ticket exists and is available
    $stmt = $pdo->prepare("SELECT status FROM rifas_boletos WHERE rifa_id = ? AND number = ?");
    $stmt->execute([$rifa_id, $ticket_number]);
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($ticket) {
        if ($ticket['status'] === 'available') {
            // Update to reserved
            $update_stmt = $pdo->prepare("UPDATE rifas_boletos SET status = 'reserved' WHERE rifa_id = ? AND number = ?");
            $update_stmt->execute([$rifa_id, $ticket_number]);
            $pdo->commit();
            $response = ['success' => true, 'message' => 'Boleto #' . $ticket_number . ' reservado con éxito.'];
        } else {
            $pdo->rollBack();
            $response = ['success' => false, 'message' => 'El boleto #' . $ticket_number . ' ya no está disponible.'];
        }
    } else {
        $pdo->rollBack();
        $response = ['success' => false, 'message' => 'El boleto #' . $ticket_number . ' no existe.'];
    }
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    $response['message'] = 'Error de base de datos: ' . $e->getMessage();
}

echo json_encode($response);
?>
