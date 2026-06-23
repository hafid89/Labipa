// ============================================================
// Toast helper (pengganti react-hot-toast)
// ============================================================
function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}
const toast = {
    show(msg, type) {
        const c = ensureToastContainer();
        const el = document.createElement('div');
        el.className = 'toast' + (type ? ' ' + type : '');
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => el.remove(), 2500);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
};

// ============================================================
// Floating Room DHT11 widget - polling tiap 2 detik
// ============================================================
(function () {
    const tempEl = document.getElementById('dht11-temp');
    const humidEl = document.getElementById('dht11-humid');
    const lastUpdateEl = document.getElementById('dht11-lastupdate');
    if (!tempEl) return; // widget tidak ada di halaman (mis. login.php)

    const refreshBtn = document.getElementById('dht11-refresh-btn');
    const historyBtn = document.getElementById('dht11-history-btn');
    const modal = document.getElementById('dht11-modal');
    const modalClose = document.getElementById('dht11-modal-close');
    const historyBody = document.getElementById('dht11-history-body');
    const rangeButtons = document.querySelectorAll('#dht11-range-buttons button');
    const deleteOldBtn = document.getElementById('dht11-delete-old');
    const deleteAllBtn = document.getElementById('dht11-delete-all');

    let currentRange = 'hour';
    let modalOpen = false;

    async function fetchLatest() {
        try {
            const res = await fetch('api/room_dht11.php?latest=true');
            const result = await res.json();
            if (result.success && result.data) {
                tempEl.textContent = result.data.temperature + '°C';
                humidEl.textContent = result.data.humidity + '%';
                lastUpdateEl.textContent = 'Last update: ' + new Date(result.data.recorded_at).toLocaleTimeString();
            }
        } catch (e) { console.error('DHT11 fetch error', e); }
    }

    function rangeToStartDate(range) {
        const now = new Date();
        const d = new Date(now);
        if (range === 'hour') d.setHours(now.getHours() - 1);
        else if (range === 'day') d.setDate(now.getDate() - 1);
        else if (range === 'week') d.setDate(now.getDate() - 7);
        return d.toISOString();
    }

    function statusBadge(status) {
        return status || '';
    }

    async function fetchHistory() {
        historyBody.innerHTML = '<div class="loading-spinner"></div>';
        try {
            const url = `api/room_dht11.php?limit=100&start_date=${encodeURIComponent(rangeToStartDate(currentRange))}`;
            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                renderHistory(result.data);
            }
        } catch (e) {
            historyBody.innerHTML = '<p class="text-center text-muted">Failed to load history</p>';
        }
    }

    function renderHistory(rows) {
        if (!rows || rows.length === 0) {
            historyBody.innerHTML = '<p class="text-center text-muted" style="padding:40px 0;">No data available for the selected period</p>';
            return;
        }
        let html = '<table><thead><tr><th>Time</th><th>Temperature</th><th>Humidity</th><th>Actions</th></tr></thead><tbody>';
        rows.forEach(r => {
            html += `<tr>
                <td>${r.recorded_at_local}</td>
                <td>${r.temperature}°C</td>
                <td>${r.humidity}%</td>
                <td><button class="btn-danger-sm" onclick="deleteDht11Record(${r.id})">Delete</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        historyBody.innerHTML = html;
    }

    window.deleteDht11Record = async function (id) {
        if (!confirm('Delete this record?')) return;
        const res = await fetch('api/room_dht11.php?id=' + id, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            toast.success('Record deleted');
            fetchHistory();
        } else {
            toast.error(result.error || 'Failed to delete');
        }
    };

    refreshBtn?.addEventListener('click', async () => {
        await fetchLatest();
        if (modalOpen) await fetchHistory();
        toast.success('Data refreshed');
    });

    historyBtn?.addEventListener('click', () => {
        modalOpen = true;
        modal.style.display = 'flex';
        fetchHistory();
    });

    modalClose?.addEventListener('click', () => {
        modalOpen = false;
        modal.style.display = 'none';
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modalOpen = false;
            modal.style.display = 'none';
        }
    });

    rangeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            rangeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = btn.dataset.range;
            fetchHistory();
        });
    });

    deleteOldBtn?.addEventListener('click', async () => {
        if (!confirm('Delete DHT11 data older than 7 days?')) return;
        const res = await fetch('api/room_dht11.php?days_old=7', { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            toast.success(result.message);
            fetchHistory();
        } else {
            toast.error('Failed to delete old data');
        }
    });

    deleteAllBtn?.addEventListener('click', async () => {
        if (!confirm('⚠️ WARNING: Delete ALL DHT11 data? This action cannot be undone!')) return;
        const res = await fetch('api/room_dht11.php?delete_all=true', { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            toast.success(result.message);
            fetchLatest();
            fetchHistory();
        } else {
            toast.error('Failed to delete all data');
        }
    });

    fetchLatest();
    setInterval(fetchLatest, (window.POLLING_INTERVAL_MS || 2000));
    setInterval(() => { if (modalOpen) fetchHistory(); }, (window.POLLING_INTERVAL_MS || 2000) * 5);
})();
