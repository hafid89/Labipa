<?php
require_once __DIR__ . '/../config/api-config.php';

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
    curl_close($ch);
    
    return json_decode($response, true);
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $youtube_url = trim($_POST['youtube_url'] ?? '');
    
    // 🔥 FIX: Pastikan $_POST['plant_name'] dan $_POST['owner_name'] selalu array
    $plantNames = isset($_POST['plant_name']) && is_array($_POST['plant_name']) ? $_POST['plant_name'] : [];
    $ownerNames = isset($_POST['owner_name']) && is_array($_POST['owner_name']) ? $_POST['owner_name'] : [];

    $validPlants = [];
    foreach ($plantNames as $i => $pn) {
        $pn = trim($pn);
        $on = isset($ownerNames[$i]) ? trim($ownerNames[$i]) : '';
        if ($pn !== '' && $on !== '') {
            $validPlants[] = ['plant_name' => $pn, 'owner_name' => $on];
        }
    }

    if ($title === '') {
        $error = 'Title wajib diisi.';
    } elseif (empty($validPlants)) {
        $error = 'Minimal 1 plant wajib diisi.';
    } else {
        // Kirim ke API backend
        $data = [
            'title' => $title,
            'description' => $description,
            'youtube_url' => $youtube_url,
            'plants' => $validPlants
        ];
        
        $result = callAPI('research.php', 'POST', $data);
        
        if (isset($result['success']) && $result['success']) {
            header('Location: /dashboard.php?id=' . $result['id']);
            exit;
        } else {
            $error = $result['error'] ?? 'Gagal menyimpan data';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Research - Plant Monitoring System</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="page">
        <?php include __DIR__ . '/../includes/navbar.php'; ?>

        <main class="container container-narrow">
            <div class="page-header-simple">
                <h1>Create New Research</h1>
                <p class="text-muted">Add research project information and plants</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <form method="POST" id="research-form">
                <div class="card">
                    <h2 class="card-title">Research Information</h2>
                    <label class="form-label">Title *</label>
                    <input type="text" name="title" required class="form-input" placeholder="e.g., Hydroponic Tomato Research" value="<?= htmlspecialchars($_POST['title'] ?? '') ?>">
                    
                    <label class="form-label">Description</label>
                    <textarea name="description" rows="3" class="form-input" placeholder="Brief description..."><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
                    
                    <label class="form-label">YouTube Live Stream URL</label>
                    <input type="url" name="youtube_url" class="form-input" placeholder="https://www.youtube.com/watch?v=..." value="<?= htmlspecialchars($_POST['youtube_url'] ?? '') ?>">
                    <p class="text-xs text-muted">Optional: Add a live stream URL</p>
                </div>

                <div class="card">
                    <div class="flex-between mb-3">
                        <h2 class="card-title" style="margin:0;">Plants</h2>
                        <button type="button" id="add-plant-btn" class="btn-dark-sm">Add Plant</button>
                    </div>
                    <p class="text-xs text-muted mb-3">Minimum 1 plant required</p>

                    <div id="plants-container">
                        <div class="plant-row">
                            <div class="flex-between mb-2">
                                <h3 class="plant-row-title">Plant 1</h3>
                            </div>
                            <div class="grid-2">
                                <input type="text" name="plant_name[]" class="form-input" placeholder="Plant Name *">
                                <input type="text" name="owner_name[]" class="form-input" placeholder="Owner Name *">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-dark">Create Research</button>
                    <a href="/" class="btn-light">Cancel</a>
                </div>
            </form>
        </main>

        <?php include __DIR__ . '/../includes/footer.php'; ?>
    </div>
    <script src="/js/research_new.js"></script>
</body>
</html>