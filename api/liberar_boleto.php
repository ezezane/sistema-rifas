<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$ticket_number = isset($input['number']) ? (int)$input['number'] : 0;

if ($ticket_number <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Número de boleto inválido.']);
    exit;
}

$file_path = '../data.json';
$response = ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];

$file_handle = fopen($file_path, 'r+');

if ($file_handle) {
    if (flock($file_handle, LOCK_EX)) {
        $data_json = fread($file_handle, filesize($file_path) ?: 1);
        $data = json_decode($data_json, true);

        $ticket_found = false;
        $ticket_updated = false;

        if (isset($data['rifas'][0]['boletos'])) {
            foreach ($data['rifas'][0]['boletos'] as &$ticket) {
                if ($ticket['number'] === $ticket_number) {
                    $ticket_found = true;
                    if ($ticket['status'] === 'sold') {
                        $ticket['status'] = 'available';
                        $ticket['owner'] = null;
                        $ticket_updated = true;
                    }
                    break;
                }
            }
            unset($ticket);
        }

        if ($ticket_found && $ticket_updated) {
            $new_data_json = json_encode($data, JSON_PRETTY_PRINT);
            ftruncate($file_handle, 0);
            rewind($file_handle);
            fwrite($file_handle, $new_data_json);
            fflush($file_handle);
            $response = ['success' => true, 'message' => 'Boleto #' . $ticket_number . ' liberado con éxito.'];
        } elseif ($ticket_found) {
            $response['message'] = 'El boleto #' . $ticket_number . ' no estaba vendido.';
        } else {
            $response['message'] = 'El boleto #' . $ticket_number . ' no existe.';
        }

        flock($file_handle, LOCK_UN);
    } else {
        $response['message'] = 'No se pudo obtener el control del archivo de datos. Intente de nuevo.';
    }
    fclose($file_handle);
} else {
    http_response_code(500);
    $response['message'] = 'Error al abrir el archivo de datos.';
}

echo json_encode($response);
?>
