(function () {
  const body = document.body;
  const researchId = body.dataset.researchId;
  const camera1 = body.dataset.camera1;
  const camera2 = body.dataset.camera2;
  const camera3 = body.dataset.camera3;
  const POLL_MS = window.POLLING_INTERVAL_MS || 500;

  // ---------- Camera tabs ----------
  const camTabs = document.querySelectorAll(".cam-tab");
  const camIframe = document.getElementById("camera-iframe");
  camTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      camTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // LOGIKA DENGAN 3 KAMERA:
      if (tab.dataset.cam === "1") {
        camIframe.src = camera1;
      } else if (tab.dataset.cam === "2") {
        camIframe.src = camera2;
      } else if (tab.dataset.cam === "3") {
        camIframe.src = camera3;
      }
    });
  });

  // ---------- Helper formatters ----------
  function formatValue(v) {
    if (v === null || v === undefined || v === "") return "--";
    return v + "%";
  }
  function statusClass(status) {
    if (!status) return "badge-gray";
    const s = status.toLowerCase();
    if (s === "dry") return "badge-dry";
    if (s === "moist") return "badge-moist";
    if (s === "wet") return "badge-wet";
    if (s === "very wet") return "badge-verywet";
    return "badge-gray";
  }

  // ---------- State ----------
  let isToggling = false;
  let isSwitching = false;
  let lastSensorStatus = null;

  // ---------- Elements ----------
  const relayToggle = document.getElementById("relay-toggle");
  const relayStatusText = document.getElementById("relay-status-text");
  const activePlantName = document.getElementById("active-plant-name");
  const activePlantOwner = document.getElementById("active-plant-owner");
  const activePlantUpdated = document.getElementById("active-plant-updated");
  const plantSelectGrid = document.getElementById("plant-select-grid");
  const soilLogSection = document.getElementById("soil-log-section");
  const soilLogTitle = document.getElementById("soil-log-title");
  const soilLogLatest = document.getElementById("soil-log-latest");
  const soilLogTbody = document.getElementById("soil-log-tbody");
  const plantsGrid = document.getElementById("plants-grid");
  const plantsTotal = document.getElementById("plants-total");

  // ---------- Main polling fetch ----------
  async function fetchBundle() {
    try {
      const res = await fetch(`api/research_detail.php?id=${researchId}`);
      const result = await res.json();
      if (result.success) render(result);
    } catch (e) {
      console.error("Polling error", e);
    }
  }

  function render(data) {
    // Relay status (skip update toggle state while user mid-toggle)
    if (!isToggling) {
      const isOn = data.sensor_status?.soil_moisture_on === "HIGH";
      relayToggle.checked = isOn;
      relayStatusText.textContent = isOn ? "ACTIVE (ON)" : "INACTIVE (OFF)";
      relayStatusText.className = "relay-status" + (isOn ? " on" : "");
    }

    // Active plant
    const ap = data.active_plant;
    if (ap && ap.plant_id) {
      activePlantName.textContent = ap.plant_name || "Plant #" + ap.plant_id;
      activePlantOwner.textContent = ap.owner_name
        ? "Owner: " + ap.owner_name
        : "";
      activePlantUpdated.textContent = ap.updated_at
        ? "Updated: " +
          new Date(ap.updated_at.replace(" ", "T")).toLocaleTimeString()
        : "";
    } else {
      activePlantName.textContent = "Not selected";
      activePlantOwner.textContent = "";
      activePlantUpdated.textContent = "";
    }

    // Plant select grid
    plantSelectGrid.innerHTML = "";
    if (data.plants.length === 0) {
      plantSelectGrid.innerHTML =
        '<p class="text-sm text-muted">No plants yet. Click "Add Plant" to get started.</p>';
    } else {
      data.plants.forEach((p) => {
        const wrap = document.createElement("div");
        wrap.className = "plant-select-btn";
        const isActive = ap && ap.plant_id == p.id;
        wrap.innerHTML = `
                    <button ${isSwitching ? "disabled" : ""} class="${isActive ? "active" : ""}">${escapeHtml(p.plant_name)}</button>
                    <button class="plant-select-del" title="Delete plant">&times;</button>
                `;
        wrap
          .querySelector("button")
          .addEventListener("click", () => setActivePlant(p.id, p.plant_name));
        wrap
          .querySelector(".plant-select-del")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            deletePlant(p.id, p.plant_name);
          });
        plantSelectGrid.appendChild(wrap);
      });
    }

    // Soil moisture live log
    const isRecording = data.sensor_status?.soil_moisture_on === "HIGH";
    if (isRecording && ap && ap.plant_id) {
      soilLogSection.style.display = "";
      soilLogTitle.textContent =
        "Soil Moisture Sensor Data - " + (ap.plant_name || "");
      if (data.soil_logs.length > 0) {
        const latest = data.soil_logs[0];
        soilLogLatest.innerHTML = `
                    <div class="plant-moisture-box" style="margin-bottom:14px;">
                        <p class="text-xs text-muted uppercase" style="margin:0;">Latest Reading</p>
                        <span class="plant-moisture-value">${formatValue(latest.moisture_value)}</span>
                        ${latest.status ? `<span class="badge ${statusClass(latest.status)}" style="margin-left:8px;">${escapeHtml(latest.status)}</span>` : ""}
                        <p class="plant-moisture-time">${new Date(latest.recorded_at.replace(" ", "T")).toLocaleString()}</p>
                    </div>`;
        let rows = "";
        data.soil_logs.forEach((log) => {
          rows += `<tr>
                        <td>${new Date(log.recorded_at.replace(" ", "T")).toLocaleString()}</td>
                        <td>${formatValue(log.moisture_value)}</td>
                        <td><span class="badge ${statusClass(log.status)}">${escapeHtml(log.status || "-")}</span></td>
                    </tr>`;
        });
        soilLogTbody.innerHTML = rows;
      } else {
        soilLogLatest.innerHTML = "";
        soilLogTbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-muted">No soil moisture data yet. Waiting for sensor...</td></tr>';
      }
    } else {
      soilLogSection.style.display = "none";
    }

    // Plants grid
    plantsTotal.textContent = "Total: " + data.plants.length;
    if (data.plants.length === 0) {
      plantsGrid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1;"><p>No plants in this research yet.</p></div>';
    } else {
      plantsGrid.innerHTML = "";
      data.plants.forEach((p) => {
        const latest = data.plant_latest[p.id];
        const isActive = ap && ap.plant_id == p.id;
        const card = document.createElement("div");
        card.className = "plant-card";
        card.innerHTML = `
                    ${isActive ? '<div style="position:absolute;top:10px;right:10px;" class="plant-card-active-badge"><span style="width:6px;height:6px;background:#16a34a;border-radius:50%;display:inline-block;"></span>ACTIVE</div>' : ""}
                    <div class="plant-card-head">
                        <div>
                            <p class="plant-card-name">${escapeHtml(p.plant_name)}</p>
                            <p class="plant-card-owner">Owner: ${escapeHtml(p.owner_name || "-")}</p>
                        </div>
                    </div>
                    <div class="plant-card-body">
                        <h4 class="text-xs text-muted uppercase" style="margin:0 0 8px;">Soil Moisture</h4>
                        ${
                          latest
                            ? `
                            <div class="plant-moisture-box">
                                <p class="plant-moisture-value">${formatValue(latest.moisture_value)}</p>
                                ${latest.status ? `<p class="plant-moisture-status">${escapeHtml(latest.status)}</p>` : ""}
                                <p class="plant-moisture-time">${new Date(latest.recorded_at.replace(" ", "T")).toLocaleTimeString()}</p>
                            </div>
                        `
                            : `
                            <div class="text-center text-sm text-muted" style="padding:16px 0;background:#f9fafb;border-radius:6px;">
                                ${isActive ? "Waiting for sensor data..." : "Not active"}
                            </div>
                        `
                        }
                        <div class="plant-card-actions">
                            <button class="btn-edit-name">Edit Name</button>
                            <button class="btn-view-history">View History</button>
                        </div>
                    </div>
                `;
        card
          .querySelector(".btn-edit-name")
          .addEventListener("click", () => editPlantName(p.id, p.plant_name));
        card
          .querySelector(".btn-view-history")
          .addEventListener("click", () =>
            openPlantDetail(p.id, p.plant_name, p.owner_name),
          );
        plantsGrid.appendChild(card);
      });
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Relay toggle ----------
  relayToggle?.addEventListener("change", async () => {
    isToggling = true;
    const newStatus = relayToggle.checked ? "HIGH" : "LOW";
    relayStatusText.textContent = "Processing...";
    try {
      const res = await fetch("api/sensor_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Relay ${newStatus === "HIGH" ? "ON" : "OFF"}`);
      } else {
        toast.error(result.error || "Failed to toggle relay");
        relayToggle.checked = !relayToggle.checked;
      }
    } catch (e) {
      toast.error("Failed to toggle relay");
      relayToggle.checked = !relayToggle.checked;
    }
    isToggling = false;
    fetchBundle();
  });

  // ---------- Active plant ----------
  async function setActivePlant(plantId, plantName) {
    isSwitching = true;
    try {
      const res = await fetch("api/active_plant.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_id: plantId, research_id: researchId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Sensor switched to: ${plantName}`);
      } else {
        toast.error(result.error || "Failed to switch sensor");
      }
    } catch (e) {
      toast.error("Failed to switch sensor");
    }
    isSwitching = false;
    fetchBundle();
  }

  // ---------- Delete plant ----------
  async function deletePlant(plantId, plantName) {
    if (!confirm(`Delete plant "${plantName}"?`)) return;
    const res = await fetch("api/plants.php?id=" + plantId, {
      method: "DELETE",
    });
    const result = await res.json();
    if (result.success) {
      toast.success(`Plant "${plantName}" deleted`);
      fetchBundle();
    } else {
      toast.error(result.error || "Failed to delete plant");
    }
  }

  // ---------- Edit plant name ----------
  async function editPlantName(plantId, currentName) {
    const newName = prompt("Edit plant name:", currentName);
    if (!newName || newName === currentName) return;
    const res = await fetch("api/plants.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plantId, plant_name: newName }),
    });
    const result = await res.json();
    if (result.success) {
      toast.success("Plant name updated");
      fetchBundle();
    } else {
      toast.error("Failed to update plant name");
    }
  }

  // ---------- Add plant modal ----------
  const addPlantModal = document.getElementById("add-plant-modal");
  document
    .getElementById("add-plant-modal-btn")
    ?.addEventListener("click", () => {
      document.getElementById("new-plant-name").value = "";
      document.getElementById("new-plant-owner").value = "";
      addPlantModal.style.display = "flex";
    });
  document
    .getElementById("add-plant-close")
    ?.addEventListener("click", () => (addPlantModal.style.display = "none"));
  document
    .getElementById("cancel-plant-btn")
    ?.addEventListener("click", () => (addPlantModal.style.display = "none"));
  document
    .getElementById("save-plant-btn")
    ?.addEventListener("click", async () => {
      const name = document.getElementById("new-plant-name").value.trim();
      const owner = document.getElementById("new-plant-owner").value.trim();
      if (!name || !owner) {
        toast.error("Plant name and owner name are required");
        return;
      }
      const res = await fetch("api/plants.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_name: name,
          owner_name: owner,
          research_id: researchId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Plant "${name}" added`);
        addPlantModal.style.display = "none";
        fetchBundle();
      } else {
        toast.error(result.error || "Failed to add plant");
      }
    });

  // ---------- Plant detail modal (charts) ----------
  const pdModal = document.getElementById("plant-detail-modal");
  const pdName = document.getElementById("pd-plant-name");
  const pdOwner = document.getElementById("pd-plant-owner");
  const pdRangeButtons = document.querySelectorAll("#pd-range-buttons button");
  let pdCurrentPlantId = null;
  let pdCurrentRange = "1day";
  let pdChartCache = null;
  let soilChart = null;
  let roomChart = null;

  function filterByRange(data, days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.filter(
      (d) => new Date(d.timestamp.replace(" ", "T")).getTime() >= cutoff,
    );
  }

  function downsample(data, maxPoints) {
    if (data.length <= maxPoints) return data;
    const step = data.length / maxPoints;
    return Array.from(
      { length: maxPoints },
      (_, i) => data[Math.round(i * step)],
    );
  }

  function openPlantDetail(plantId, plantName, ownerName) {
    pdCurrentPlantId = plantId;
    pdChartCache = null; // reset cache saat buka tanaman baru
    pdName.textContent = plantName;
    pdOwner.textContent = "Owner: " + (ownerName || "-");
    pdModal.style.display = "flex";
    loadPlantChart();
  }

  document
    .getElementById("pd-close-btn")
    ?.addEventListener("click", () => (pdModal.style.display = "none"));
  pdModal?.addEventListener("click", (e) => {
    if (e.target === pdModal) pdModal.style.display = "none";
  });
  document.getElementById("pd-refresh-btn")?.addEventListener("click", () => {
    pdChartCache = null; // force re-fetch saat refresh
    loadPlantChart();
  });

  pdRangeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pdRangeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      pdCurrentRange = btn.dataset.range;
      loadPlantChart();
    });
  });

  async function loadPlantChart() {
    if (!pdCurrentPlantId) return;
    try {
      // Fetch sekali, filter range di client-side (data sudah dibatasi 3 hari di DB)
      if (!pdChartCache) {
        const res = await fetch(
          `api/plant_chart.php?plant_id=${pdCurrentPlantId}`,
        );
        const result = await res.json();
        if (!result.success) return;
        pdChartCache = result;
      }
      const days =
        pdCurrentRange === "3days" ? 3 : pdCurrentRange === "2days" ? 2 : 1;
      const soil = downsample(filterByRange(pdChartCache.soil, days), 150);
      const room = downsample(filterByRange(pdChartCache.room, days), 150);
      renderSoilChart(soil);
      renderRoomChart(room);
    } catch (e) {
      console.error("Chart load error", e);
    }
  }

  function showChartEmpty(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  function renderSoilChart(data) {
    const ctx = document.getElementById("pd-soil-chart").getContext("2d");
    if (soilChart) soilChart.destroy();
    if (!data || data.length === 0) {
      showChartEmpty(
        "pd-soil-chart",
        "Belum ada data kelembaban tanah pada rentang waktu ini",
      );
      soilChart = null;
      return;
    }
    const pointR = data.length > 80 ? 0 : 2;
    soilChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.time),
        datasets: [
          {
            label: "Kelembaban Tanah (%)",
            data: data.map((d) => d.moisture),
            borderColor: "#16a34a",
            backgroundColor: "rgba(22,163,74,0.08)",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: pointR,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
          y: {
            min: 0,
            max: 100,
            title: { display: true, text: "Kelembaban (%)" },
          },
        },
      },
    });
  }

  function renderRoomChart(data) {
    const ctx = document.getElementById("pd-room-chart").getContext("2d");
    if (roomChart) roomChart.destroy();
    if (!data || data.length === 0) {
      showChartEmpty(
        "pd-room-chart",
        "Belum ada data suhu & kelembaban ruangan pada rentang waktu ini",
      );
      roomChart = null;
      return;
    }
    const pointR = data.length > 80 ? 0 : 2;
    roomChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.time),
        datasets: [
          {
            label: "Suhu (°C)",
            data: data.map((d) => d.temperature),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            yAxisID: "y-temp",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: pointR,
          },
          {
            label: "Kelembaban Ruangan (%)",
            data: data.map((d) => d.humidity),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.08)",
            yAxisID: "y-humid",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: pointR,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 10, maxRotation: 45 } },
          "y-temp": {
            type: "linear",
            position: "left",
            title: { display: true, text: "Suhu (°C)" },
          },
          "y-humid": {
            type: "linear",
            position: "right",
            title: { display: true, text: "Kelembaban (%)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // ---------- Init ----------
  fetchBundle();
  setInterval(fetchBundle, POLL_MS);
})();
