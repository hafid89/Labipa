<!-- Floating Widget: Room DHT11 -->
<div id="dht11-widget" class="dht11-widget">
    <div class="dht11-widget-body">
        <div class="dht11-stat">
            <div class="dht11-label">Temperature</div>
            <div class="dht11-value" id="dht11-temp">--</div>
        </div>
        <div class="dht11-divider"></div>
        <div class="dht11-stat">
            <div class="dht11-label">Humidity</div>
            <div class="dht11-value" id="dht11-humid">--</div>
        </div>
        <div class="dht11-actions">
            <button id="dht11-refresh-btn" title="Refresh data">⟳</button>
            <button id="dht11-history-btn" title="View history">≡</button>
        </div>
    </div>
    <div class="dht11-lastupdate" id="dht11-lastupdate"></div>
</div>

<!-- History Modal -->
<div id="dht11-modal" class="modal-overlay" style="display:none;">
    <div class="modal-box modal-lg">
        <div class="modal-header">
            <div>
                <h2>DHT11 Data History</h2>
                <p class="modal-subtitle">Room temperature and humidity records</p>
            </div>
            <button class="modal-close" id="dht11-modal-close">&times;</button>
        </div>
        <div class="modal-toolbar">
            <div class="btn-group" id="dht11-range-buttons">
                <button data-range="hour" class="active">Last Hour</button>
                <button data-range="day">Last Day</button>
                <button data-range="week">Last Week</button>
            </div>
            <div class="btn-group">
                <button id="dht11-delete-old" class="btn-warning-sm">Delete &gt; 7 days</button>
                <button id="dht11-delete-all" class="btn-danger-sm">Delete All</button>
            </div>
        </div>
        <div class="modal-body" id="dht11-history-body">
            <div class="loading-spinner"></div>
        </div>
    </div>
</div>