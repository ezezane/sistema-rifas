<?php
require_once 'config.php';

$json_file = 'data.json';

if (!file_exists($json_file)) {
    die("data.json not found.\n");
}

$data = json_decode(file_get_contents($json_file), true);

if (!$data || !isset($data['rifas'])) {
    die("Invalid JSON data.\n");
}

try {
    $pdo->beginTransaction();

    foreach ($data['rifas'] as $rifa) {
        // Insert rifa
        $stmt = $pdo->prepare("INSERT INTO rifas_rifas (name, description, prize, ticket_price, total_tickets) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $rifa['name'],
            $rifa['description'],
            $rifa['prize'],
            $rifa['ticket_price'],
            $rifa['total_tickets']
        ]);
        $rifa_id = $pdo->lastInsertId();

        // Insert boletos
        if (isset($rifa['boletos'])) {
            $stmt_boleto = $pdo->prepare("INSERT INTO rifas_boletos (rifa_id, number, status, owner) VALUES (?, ?, ?, ?)");
            foreach ($rifa['boletos'] as $boleto) {
                $stmt_boleto->execute([
                    $rifa_id,
                    $boleto['number'],
                    $boleto['status'],
                    $boleto['owner']
                ]);
            }
        }
    }

    // If winner exists
    if (isset($data['winner']) && $data['winner']) {
        $stmt_winner = $pdo->prepare("INSERT INTO rifas_winners (rifa_id, ticket_number, winner_name) VALUES (?, ?, ?)");
        $stmt_winner->execute([
            1, // assuming rifa_id 1
            $data['winner']['ticket_number'] ?? null,
            $data['winner']['winner_name'] ?? null
        ]);
    }

    $pdo->commit();
    echo "Migration completed successfully.\n";
} catch (PDOException $e) {
    $pdo->rollBack();
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>