<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate'); // Ensure client gets fresh data

require_once '../config.php';

$rifa_id = isset($_GET['rifa_id']) ? (int)$_GET['rifa_id'] : null;

try {
    if ($rifa_id) {
        // Get specific rifa
        $stmt = $pdo->prepare("SELECT * FROM rifas_rifas WHERE id = ?");
        $stmt->execute([$rifa_id]);
        $rifas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Get all rifas
        $stmt = $pdo->query("SELECT * FROM rifas_rifas");
        $rifas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $data = ['rifas' => []];

    foreach ($rifas as $rifa) {
        $rifa_id_current = $rifa['id'];
        // Get boletos for this rifa
        $stmt_boletos = $pdo->prepare("SELECT number, status, owner FROM rifas_boletos WHERE rifa_id = ? ORDER BY number");
        $stmt_boletos->execute([$rifa_id_current]);
        $boletos = $stmt_boletos->fetchAll(PDO::FETCH_ASSOC);

        $rifa['boletos'] = $boletos;
        $data['rifas'][] = $rifa;
    }

    // Get participants for the rifa(s)
    if ($rifa_id) {
        $stmt_participants = $pdo->prepare("SELECT owner, GROUP_CONCAT(number ORDER BY number SEPARATOR ', ') as numbers FROM rifas_boletos WHERE rifa_id = ? AND status = 'sold' AND owner IS NOT NULL AND owner != '' GROUP BY owner ORDER BY owner");
        $stmt_participants->execute([$rifa_id]);
    } else {
        // For all rifas, but since participants are per rifa, maybe not needed
        $stmt_participants = $pdo->prepare("SELECT rifa_id, owner, GROUP_CONCAT(number ORDER BY number SEPARATOR ', ') as numbers FROM rifas_boletos WHERE status = 'sold' AND owner IS NOT NULL AND owner != '' GROUP BY rifa_id, owner ORDER BY owner");
        $stmt_participants->execute();
    }
    $participants = $stmt_participants->fetchAll(PDO::FETCH_ASSOC);
    $data['participants'] = $participants;

    // Get winner if any
    $stmt_winner = $pdo->query("SELECT * FROM rifas_winners ORDER BY draw_date DESC LIMIT 1");
    $winner = $stmt_winner->fetch(PDO::FETCH_ASSOC);
    $data['winner'] = $winner ? $winner : null;

    echo json_encode($data);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
