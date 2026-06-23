<?php
require_once __DIR__ . '/../config/api-config.php';

function callAPI($endpoint, $method = 'GET', $data = null) {
    // ... sama seperti di index.php
}

$id = $_GET['id'] ?? null;
if (!$id) {
    header('Location: /');
    exit;
}

// Ambil data research dari API
$result = callAPI('research_detail.php?id=' . $id);
$research = $result['research'] ?? null;

if (!$research) {
    include __DIR__ . '/../includes/navbar.php';
    echo '<main class="container"><p class="text-center text-error">Research not found</p></main>';
    include __DIR__ . '/../includes/footer.php';
    exit;
}

$researchId = (int)$research['id'];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($research['title']) ?> - Plant Monitoring</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body data-research-id="<?= $researchId ?>" data-camera1="http://localhost:8081" data-camera2="http://localhost:8082" data-camera3="http://localhost:8080">
    <div class="page">
        <?php include __DIR__ . '/../includes/navbar.php'; ?>

        <main class="container">
            <!-- KONTEN SAMA SEPERTI research_detail.php YANG LAMA -->
            <!-- TAPI SEMUA DATA DARI API, BUKAN DATABASE LANGSUNG -->
            
            <div class="mb-4">
                <a href="/" class="back-link">&larr; Back to Dashboard</a>
                <div class="flex-between">
                    <div>
                        <h1 id="research-title"><?= htmlspecialchars($research['title']) ?></h1>
                        <p class="text-muted" id="research-desc"><?= htmlspecialchars($research['description']) ?></p>
                    </div>
                    <button id="add-plant-modal-btn" class="btn-dark">Add Plant</button>
                </div>
            </div>

            <!-- Camera Streams -->
            <div class="card mb-4">
                <h2 class="card-title">Monitoring Video</h2>
                <div class="camera-tabs">
                    <button class="cam-tab active" data-cam="1">Kamera 1</button>
                    <button class="cam-tab" data-cam="2">Kamera 2</button>
                    <button class="cam-tab" data-cam="3">Kamera 3 (Live & Rewind)</button>
                </div>
                <div class="camera-frame">
                    <iframe id="camera-iframe" src="http://localhost:8081" allowfullscreen allow="autoplay; fullscreen"></iframe>
                </div>
            </div>

            <!-- Sensor Control Panel -->
            <div class="card mb-4">
                <h2 class="card-title">Sensor Control</h2>
                <div class="flex-between mb-4">
                    <div>
                        <p class="text-xs text-muted uppercase">Relay Status</p>
                        <p id="relay-status-text" class="relay-status">INACTIVE (OFF)</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="relay-toggle">
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="divider-top">
                    <div class="flex-between mb-3">
                        <div>
                            <p class="text-xs text-muted uppercase">Active Plant</p>
                            <p id="active-plant-name" class="active-plant-name">Not selected</p>
                            <p id="active-plant-owner" class="text-xs text-muted"></p>
                        </div>
                        <div class="text-xs text-muted" id="active-plant-updated"></div>
                    </div>

                    <p class="text-xs form-label">Select Plant to Measure:</p>
                    <div id="plant-select-grid" class="plant-select-grid"></div>
                    <p class="text-xs text-muted mt-2">Select which plant currently has the soil moisture sensor attached.</p>
                </div>
            </div>

            <!-- Soil Moisture Live Log -->
            <div id="soil-log-section" class="card mb-4" style="display:none;">
                <h2 class="card-title" id="soil-log-title">Soil Moisture Sensor Data</h2>
                <div id="soil-log-latest"></div>
                <div class="table-wrap">
                    <table id="soil-log-table">
                        <thead>
                            <tr><th>Time</th><th>Value</th><th>Status</th></tr>
                        </thead>
                        <tbody id="soil-log-tbody"></tbody>
                    </table>
                </div>
            </div>

            <!-- Plants Grid -->
            <div class="flex-between mb-3">
                <h2 class="section-title">All Plants</h2>
                <span class="text-xs text-muted" id="plants-total">Total: 0</span>
            </div>
            <div id="plants-grid" class="plants-grid"></div>
        </main>

        <?php include __DIR__ . '/../includes/footer.php'; ?>
    </div>

    <!-- Modals -->
    <div id="add-plant-modal" class="modal-overlay" style="display:none;">
        <div class="modal-box modal-sm">
            <div class="modal-header">
                <h3>Add New Plant</h3>
                <button class="modal-close" id="add-plant-close">&times;</button>
            </div>
            <div class="modal-body">
                <label class="form-label">Plant Name *</label>
                <input type="text" id="new-plant-name" class="form-input" placeholder="e.g., Tomato Plant">
                <label class="form-label">Owner Name *</label>
                <input type="text" id="new-plant-owner" class="form-input" placeholder="e.g., Farmer Group">
                <div class="form-actions">
                    <button id="save-plant-btn" class="btn-dark">Save Plant</button>
                    <button id="cancel-plant-btn" class="btn-light">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <div id="plant-detail-modal" class="modal-overlay" style="display:none;">
        <div class="modal-box modal-lg">
            <div class="modal-header">
                <div>
                    <h2 id="pd-plant-name"></h2>
                    <p class="modal-subtitle" id="pd-plant-owner"></p>
                </div>
                <div class="btn-group">
                    <button id="pd-refresh-btn" class="btn-light-sm">Refresh Data</button>
                    <button class="modal-close" id="pd-close-btn">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <span class="form-label" style="margin-right:8px;">Time Range:</span>
                    <div class="btn-group" id="pd-range-buttons">
                        <button data-range="day" class="active">Today</button>
                        <button data-range="week">Last 7 Days</button>
                        <button data-range="month">Last 30 Days</button>
                    </div>
                </div>
                <h3 class="chart-title">Soil Moisture History</h3>
                <div class="chart-container"><canvas id="pd-soil-chart"></canvas></div>
                <h3 class="chart-title mt-4">Room Temperature & Humidity History</h3>
                <div class="chart-container"><canvas id="pd-room-chart"></canvas></div>
            </div>
        </div>
    </div>

    <script src="/js/dht11.js"></script>
    <script src="/js/research_detail.js"></script>
</body>
</html>