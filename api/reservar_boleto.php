<?php
header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// Get the incoming data
$input = json_decode(file_get_contents('php://input'), true);
$ticket_number = isset($input['number']) ? (int)$input['number'] : 0;

if ($ticket_number <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Número de boleto inválido.']);
    exit;
}

$file_path = '../data.json';
$response = ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];

// Open the file with read/write permissions
$file_handle = fopen($file_path, 'r+');

if ($file_handle) {
    // Acquire an exclusive lock (blocking)
    if (flock($file_handle, LOCK_EX)) {
        // In case the file is empty
        $filesize = filesize($file_path);
        if ($filesize === 0) {
            $data_json = '{"rifas": [], "winner": null}';
        } else {
            $data_json = fread($file_handle, $filesize);
        }
        
        $data = json_decode($data_json, true);

        $ticket_found = false;
        $ticket_available = false;

        // Assuming one raffle for now, find the ticket
        if (isset($data['rifas'][0]['boletos'])) {
            foreach ($data['rifas'][0]['boletos'] as &$ticket) {
                if ($ticket['number'] === $ticket_number) {
                    $ticket_found = true;
                    if ($ticket['status'] === 'available') {
                        $ticket['status'] = 'reserved';
                        $ticket_available = true;
                    }
                    break;
                }
            }
            unset($ticket); // Unset reference
        }

        if ($ticket_found && $ticket_available) {
            // If the ticket was available and is now reserved, write back to the file
            $new_data_json = json_encode($data, JSON_PRETTY_PRINT);
            ftruncate($file_handle, 0); // Truncate the file
            rewind($file_handle);       // Move pointer to the beginning
            fwrite($file_handle, $new_data_json);
            fflush($file_handle);       // Flush output before releasing the lock
            $response = ['success' => true, 'message' => 'Boleto #' . $ticket_number . ' reservado con éxito.'];
        } elseif ($ticket_found) {
            $response = ['success' => false, 'message' => 'El boleto #' . $ticket_number . ' ya no está disponible.'];
        } else {
            $response = ['success' => false, 'message' => 'El boleto #' . $ticket_number . ' no existe.'];
        }

        flock($file_handle, LOCK_UN); // Release the lock
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
