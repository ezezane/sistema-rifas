<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$ticket_numbers = isset($input['numbers']) && is_array($input['numbers']) ? $input['numbers'] : [];
$owner_name = isset($input['name']) ? trim($input['name']) : '';

if (empty($ticket_numbers) || empty($owner_name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos: se requiere nombre y al menos un número.']);
    exit;
}

$file_path = '../data.json';
$response = ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];

$file_handle = fopen($file_path, 'r+');

if ($file_handle) {
    if (flock($file_handle, LOCK_EX)) {
        $data_json = fread($file_handle, filesize($file_path) ?: 1);
        $data = json_decode($data_json, true);
        
        $all_tickets_available = true;
        $unavailable_tickets = [];

        // 1. First, check if all requested tickets are available
        foreach ($ticket_numbers as $number) {
            $found = false;
            foreach ($data['rifas'][0]['boletos'] as $ticket) {
                if ($ticket['number'] === (int)$number) {
                    $found = true;
                    if ($ticket['status'] !== 'available') {
                        $all_tickets_available = false;
                        $unavailable_tickets[] = $number;
                    }
                    break;
                }
            }
            if (!$found) {
                $all_tickets_available = false;
                $unavailable_tickets[] = $number;
            }
        }

        // 2. If all are available, proceed to update them
        if ($all_tickets_available) {
            foreach ($data['rifas'][0]['boletos'] as &$ticket) {
                if (in_array($ticket['number'], $ticket_numbers)) {
                    $ticket['status'] = 'sold';
                    $ticket['owner'] = $owner_name;
                }
            }
            unset($ticket);

            $new_data_json = json_encode($data, JSON_PRETTY_PRINT);
            ftruncate($file_handle, 0);
            rewind($file_handle);
            fwrite($file_handle, $new_data_json);
            fflush($file_handle);
            
            $response = ['success' => true, 'message' => '¡Boletos guardados con éxito a nombre de ' . $owner_name . '!'];
        } else {
            $response['message'] = 'No se pudo guardar. Los siguientes números ya no están disponibles: ' . implode(', ', $unavailable_tickets);
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
