<?php
require_once __DIR__ . '/../config/api-config.php';

// Fungsi helper untuk panggil API
function callAPI($endpoint, $method = 'GET', $data = null) {
    $url = API_BASE_URL . '/' . $endpoint;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, API_TIMEOUT);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if (API_DEBUG) {
        return ['success' => true, 'data' => json_decode($response, true)];
    }
    
    return json_decode($response, true);
}

// Ambil data research dari API
$result = callAPI('research_detail.php?id=all');
$researchList = $result['data'] ?? [];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Plant Monitoring System</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="page">
        <?php include __DIR__ . '/../includes/navbar.php'; ?>
        
        <main class="container">
            <div class="page-header">
                <div>
                    <h1>Research Dashboard</h1>
                    <p class="text-muted">Manage your plant research projects</p>
                </div>
                <a href="/research.php" class="btn-dark">New Research</a>
            </div>

            <?php if (empty($researchList)): ?>
                <div class="empty-state">
                    <p>No research projects yet.</p>
                    <a href="/research.php" class="btn-dark">Create Your First Research</a>
                </div>
            <?php else: ?>
                <div class="flex-between mb-4">
                    <p class="text-muted text-sm">Total: <?= count($researchList) ?> projects</p>
                </div>
                <div class="card-grid">
                    <?php foreach ($researchList as $research): ?>
                        <div class="card research-card">
                            <h2 class="research-title"><?= htmlspecialchars($research['title']) ?></h2>
                            <p class="research-desc"><?= htmlspecialchars($research['description'] ?: 'No description') ?></p>
                            <div class="flex-between">
                                <span class="text-xs text-muted"><?= htmlspecialchars(date('d M Y', strtotime($research['created_at']))) ?></span>
                                <a href="/dashboard.php?id=<?= (int)$research['id'] ?>" class="btn-dark-sm">View Details</a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </main>

        <?php include __DIR__ . '/../includes/footer.php'; ?>
    </div>
    <script src="/js/dht11.js"></script>
</body>
</html>