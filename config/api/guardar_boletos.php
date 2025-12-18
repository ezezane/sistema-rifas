<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);
$ticket_numbers = isset($input['numbers']) && is_array($input['numbers']) ? $input['numbers'] : [];
$owner_name = isset($input['name']) ? trim($input['name']) : '';
$rifa_id = isset($input['rifa_id']) ? (int)$input['rifa_id'] : 1;

if (empty($ticket_numbers) || empty($owner_name) || $rifa_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos: se requiere nombre, números y rifa válida.']);
    exit;
}

$response = ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];

try {

    // Start transaction
    $pdo->beginTransaction();

    $all_tickets_available = true;
    $unavailable_tickets = [];

    // 1. First, check if all requested tickets are available
    $placeholders = str_repeat('?,', count($ticket_numbers) - 1) . '?';
    $stmt = $pdo->prepare("SELECT number, status FROM rifas_boletos WHERE rifa_id = ? AND number IN ($placeholders)");
    $params = array_merge([$rifa_id], $ticket_numbers);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $found_numbers = array_column($tickets, 'number');
    $missing = array_diff($ticket_numbers, $found_numbers);
    if (!empty($missing)) {
        $all_tickets_available = false;
        $unavailable_tickets = array_merge($unavailable_tickets, $missing);
    }

    foreach ($tickets as $ticket) {
        if ($ticket['status'] !== 'available') {
            $all_tickets_available = false;
            $unavailable_tickets[] = $ticket['number'];
        }
    }

    // 2. If all are available, proceed to update them
    if ($all_tickets_available) {
        $update_stmt = $pdo->prepare("UPDATE rifas_boletos SET status = 'sold', owner = ? WHERE rifa_id = ? AND number = ?");
        foreach ($ticket_numbers as $number) {
            $update_stmt->execute([$owner_name, $rifa_id, $number]);
        }
        $pdo->commit();
        $response = ['success' => true, 'message' => '¡Boletos guardados con éxito a nombre de ' . $owner_name . '!'];
    } else {
        $pdo->rollBack();
        $response['message'] = 'No se pudo guardar. Los siguientes números ya no están disponibles: ' . implode(', ', $unavailable_tickets);
    }
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    $response['message'] = 'Error de base de datos: ' . $e->getMessage();
}

echo json_encode($response);
?>
