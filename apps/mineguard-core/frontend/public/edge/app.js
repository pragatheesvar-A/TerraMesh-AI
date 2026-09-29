/**
 * TerraMesh AI — Interactive GIS Command Dashboard Logic
 * ========================================================
 * Leaflet GIS Mining Map, WebSocket Real-Time Telemetry Stream,
 * Bilingual XAI Card Rendering, and SIH Judge Demonstration Rig.
 */

// Jharia Coalfield Coordinates (Dhanbad, Jharkhand, India)
const JHARIA_CENTER = [23.7512, 86.4225];

let map = null;
let nodeMarkers = {};
let panelBoundary = null;
let activeNodeId = "NODE_01";
let socket = null;

// Telemetry history cache for charts: node_id -> { timestamps: [], tilt: [], crack: [], vib: [], strain: [] }
const telemetryHistory = {};

// Chart.js instances
let chartDeformation = null;
let chartVibration = null;

// Warning tier color map
const TIER_COLORS = {
  NORMAL: "#10B981",
  WATCH: "#F59E0B",
  WARNING: "#F97316",
  CRITICAL: "#EF4444",
};


// -------------------------------------------------------------
// 1. Map Initialization
// -------------------------------------------------------------
function initMap() {
  map = L.map("map-view", {
    center: JHARIA_CENTER,
    zoom: 16,
    zoomControl: false,
  });

  // Top-right zoom control
  L.control.zoom({ position: "topright" }).addTo(map);

  // Esri Dark Gray Tactical Basemap (100% Free, No API Key, No Watermark)
  const darkBase = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "© Esri, OpenStreetMap contributors | TerraMesh AI",
    maxZoom: 20,
    maxNativeZoom: 16,
  });
  const darkRef = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 20,
    maxNativeZoom: 16,
  });
  L.layerGroup([darkBase, darkRef]).addTo(map);

  // Draw Jharia Colliery Longwall Panel Boundary (Panel A-04)
  const panelPolygon = [
    [23.7535, 86.4190],
    [23.7535, 86.4260],
    [23.7490, 86.4260],
    [23.7490, 86.4190],
  ];

  panelBoundary = L.polygon(panelPolygon, {
    color: "#06B6D4",
    weight: 2,
    dashArray: "6, 6",
    fillColor: "#06B6D4",
    fillOpacity: 0.05,
  }).addTo(map);

  panelBoundary.bindTooltip("LONGWALL PANEL A-04 (ACTIVE GOAF)", {
    permanent: true,
    direction: "center",
    className: "panel-label-tooltip",
  });
}


// -------------------------------------------------------------
// 2. Node Marker Rendering & Updates
// -------------------------------------------------------------
function getLatLngFromXY(x, y) {
  // Convert simulation grid (x: -150 to 150m, y: -100 to 100m) to geographical lat/lon
  const latOffset = y * 0.000009;
  const lonOffset = x * 0.0000098;
  return [JHARIA_CENTER[0] + latOffset, JHARIA_CENTER[1] + lonOffset];
}

function updateOrCreateMarker(nodeId, x, y, tier, batt) {
  const latLng = getLatLngFromXY(x, y);
  const color = TIER_COLORS[tier] || TIER_COLORS.NORMAL;
  const isCritical = tier === "CRITICAL";

  if (!nodeMarkers[nodeId]) {
    // Create new circle marker
    const marker = L.circleMarker(latLng, {
      radius: isCritical ? 12 : 8,
      fillColor: color,
      color: "#FFFFFF",
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.85,
    }).addTo(map);

    marker.bindTooltip(`<b>${nodeId}</b><br>Tier: ${tier}`, { direction: "top", offset: [0, -8] });
    marker.on("click", () => selectNode(nodeId));

    nodeMarkers[nodeId] = marker;
  } else {
    // Update existing marker
    const marker = nodeMarkers[nodeId];
    marker.setLatLng(latLng);
    marker.setStyle({
      fillColor: color,
      radius: isCritical ? 12 : 8,
      weight: nodeId === activeNodeId ? 3 : 2,
      color: nodeId === activeNodeId ? "#06B6D4" : "#FFFFFF",
    });
    marker.setTooltipContent(`<b>${nodeId}</b><br>Tier: ${tier}`);
  }
}


function selectNode(nodeId) {
  activeNodeId = nodeId;
  document.getElementById("card-node-title").textContent = `Node Telemetry: ${nodeId}`;
  document.getElementById("chart-node-label").textContent = `Live Telemetry: ${nodeId}`;

  // Pan smoothly to selected node
  if (nodeMarkers[nodeId]) {
    map.panTo(nodeMarkers[nodeId].getLatLng(), { animate: true, duration: 0.8 });
  }

  // Refresh charts with selected node's history
  updateCharts();
}


// -------------------------------------------------------------
// 3. Telemetry & Chart.js Engine
// -------------------------------------------------------------
function initCharts() {
  const ctxDef = document.getElementById("chart-deformation").getContext("2d");
  const ctxVib = document.getElementById("chart-vibration").getContext("2d");

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#64748B", font: { size: 10 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94A3B8", font: { size: 10 } },
      },
    },
    plugins: {
      legend: { labels: { color: "#F1F5F9", font: { size: 11, family: "Outfit" } } },
    },
  };

  chartDeformation = new Chart(ctxDef, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Tilt Magnitude (mrad)",
          data: [],
          borderColor: "#06B6D4",
          backgroundColor: "rgba(6,182,212,0.1)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
        {
          label: "Crack Gap (mm)",
          data: [],
          borderColor: "#F59E0B",
          backgroundColor: "rgba(245,158,11,0.1)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
      ],
    },
    options: commonOptions,
  });

  chartVibration = new Chart(ctxVib, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Vibration RMS (g)",
          data: [],
          borderColor: "#EF4444",
          borderWidth: 1.5,
          pointRadius: 2,
          tension: 0.2,
        },
        {
          label: "Strain (με / 10)",
          data: [],
          borderColor: "#10B981",
          borderWidth: 1.5,
          pointRadius: 2,
          tension: 0.2,
        },
      ],
    },
    options: commonOptions,
  });
}


function pushTelemetryToHistory(nodeId, timestamp, tilt, crack, vib, strain) {
  if (!telemetryHistory[nodeId]) {
    telemetryHistory[nodeId] = { times: [], tilt: [], crack: [], vib: [], strain: [] };
  }
  const h = telemetryHistory[nodeId];
  const timeLabel = `${timestamp.toFixed(1)}h`;
  h.times.push(timeLabel);
  h.tilt.push(tilt);
  h.crack.push(crack);
  h.vib.push(vib);
  h.strain.push(strain / 10.0);

  // Keep last 30 points
  if (h.times.length > 30) {
    h.times.shift();
    h.tilt.shift();
    h.crack.shift();
    h.vib.shift();
    h.strain.shift();
  }

  if (nodeId === activeNodeId) {
    updateCharts();
  }
}


function updateCharts() {
  const h = telemetryHistory[activeNodeId];
  if (!h || !chartDeformation || !chartVibration) return;

  chartDeformation.data.labels = h.times;
  chartDeformation.data.datasets[0].data = h.tilt;
  chartDeformation.data.datasets[1].data = h.crack;
  chartDeformation.update();

  chartVibration.data.labels = h.times;
  chartVibration.data.datasets[0].data = h.vib;
  chartVibration.data.datasets[1].data = h.strain;
  chartVibration.update();
}


// -------------------------------------------------------------
// 4. Bilingual XAI Explainability Card Rendering
// -------------------------------------------------------------
function renderXaiCard(card) {
  if (!card) return;

  const badge = document.getElementById("card-risk-badge");
  if (badge) {
    badge.textContent = card.warning_tier_en;
    badge.style.borderColor = card.badge_color;
    badge.style.color = card.badge_color;
    badge.style.backgroundColor = `${card.badge_color}22`;
  }

  const summaryEl = document.getElementById("card-summary-en");
  if (summaryEl) summaryEl.textContent = card.summary_en;

  const spatialEl = document.getElementById("card-spatial-en");
  if (spatialEl) spatialEl.textContent = card.spatial_consensus_en;

  const actionEl = document.getElementById("card-action-en");
  if (actionEl) actionEl.textContent = card.action_protocol_en;

  // Update physical metric values
  if (card.key_evidence && card.key_evidence.length >= 4) {
    const tiltEl = document.getElementById("card-val-tilt");
    const crackEl = document.getElementById("card-val-crack");
    const strainEl = document.getElementById("card-val-strain");
    const vibEl = document.getElementById("card-val-vib");
    if (tiltEl) tiltEl.textContent = card.key_evidence[0].value;
    if (crackEl) crackEl.textContent = card.key_evidence[1].value;
    if (strainEl) strainEl.textContent = card.key_evidence[2].value;
    if (vibEl) vibEl.textContent = card.key_evidence[3].value;
  }
}


// -------------------------------------------------------------
// 5. WebSocket Real-Time Streaming
// -------------------------------------------------------------
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/live-monitoring`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("[WS] Connected to TerraMesh AI Edge Gateway");
    document.getElementById("gateway-status").textContent = "GATEWAY: STREAMING";
    document.getElementById("gateway-beacon").style.background = "var(--tier-normal)";
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    // Backend contract: /ws/live-monitoring greets with {"type": "CONNECTED"}.
    // (This page previously expected an INITIAL_STATE message that the
    // backend never sent, and dialed the wrong path /ws/live.)
    if (msg.type === "CONNECTED" || msg.type === "INITIAL_STATE") {
      const nodes = msg.nodes || (msg.data && msg.data.sensors) || [];
      if (Array.isArray(nodes) && nodes.length) {
        nodes.forEach((n) => {
          updateOrCreateMarker(
            n.node_id || n.id, n.pos_x || 0, n.pos_y || 0,
            n.warning_tier || n.status || "NORMAL", n.battery_v || n.battery || null);
        });
        document.getElementById("node-count-badge").textContent = nodes.length;
      }
    } else if (msg.type === "TELEMETRY_UPDATE") {
      const nid = msg.node_id;
      const t = msg.telemetry;
      const dec = msg.decision;

      // Update map marker
      updateOrCreateMarker(nid, msg.pos_x, msg.pos_y, dec.warning_tier, t.batt_v);

      // Cache telemetry
      pushTelemetryToHistory(nid, msg.timestamp_h, t.tilt_mag_mrad, t.crack_mm, t.vib_rms_g, t.strain_ustrain);

      // If this is the active node, update the XAI card
      if (nid === activeNodeId && msg.card) {
        renderXaiCard(msg.card);
      }

      // Update Siren Badge
      updateSirenState(dec.siren_active, dec.siren_suppressed);

      // Update Master Header Status
      updateMasterStatus(dec.warning_tier);
    }
  };

  socket.onclose = () => {
    console.log("[WS] Connection lost, reconnecting in 2s...");
    document.getElementById("gateway-status").textContent = "GATEWAY: RECONNECTING";
    document.getElementById("gateway-beacon").style.background = "var(--tier-watch)";
    setTimeout(connectWebSocket, 2000);
  };
}


function updateSirenState(active, suppressed) {
  const badge = document.getElementById("siren-badge");
  const icon = document.getElementById("siren-icon");
  const text = document.getElementById("siren-text");

  if (active) {
    badge.className = "badge tier-critical";
    icon.textContent = "🚨";
    text.textContent = "SIREN: ACTIVE!";
  } else if (suppressed) {
    badge.className = "badge tier-watch";
    icon.textContent = "🔇";
    text.textContent = "SIREN: BLAST SUPPRESSED";
  } else {
    badge.className = "badge";
    icon.textContent = "🔔";
    text.textContent = "SIREN: SILENT";
  }
}


function updateMasterStatus(tier) {
  const master = document.getElementById("master-risk-badge");
  master.className = `master-risk-badge tier-${tier.toLowerCase()}`;
  master.textContent = `STATUS: ${tier}`;
}


// -------------------------------------------------------------
// 6. SIH Judge Demonstration Rig Controls
// -------------------------------------------------------------
async function triggerScenario(scenarioName) {
  // Highlight active button
  document.querySelectorAll(".btn-scenario").forEach((btn) => btn.classList.remove("active"));
  const speed = parseFloat(document.getElementById("playback-speed").value) || 5.0;

  try {
    const res = await fetch("/api/scenario/inject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_name: scenarioName, speed: speed, max_cycles: 80 }),
    });
    const data = await res.json();
    console.log("[DEMO] Injected scenario:", data);
  } catch (err) {
    console.error("[DEMO] Injection failed:", err);
  }
}


async function stopScenario() {
  document.querySelectorAll(".btn-scenario").forEach((btn) => btn.classList.remove("active"));
  try {
    await fetch("/api/scenario/stop", { method: "POST" });
    console.log("[DEMO] Stopped playback");
  } catch (err) {
    console.error("[DEMO] Stop failed:", err);
  }
}


// -------------------------------------------------------------
// 7. Tab Switching
// -------------------------------------------------------------
function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-view").forEach((view) => (view.style.display = "none"));

  if (btn) {
    btn.classList.add("active");
  } else if (typeof event !== "undefined" && event && event.target) {
    event.target.classList.add("active");
  }
  const targetView = document.getElementById(`tab-${tabId}`);
  if (targetView) targetView.style.display = "block";

  if (tabId === "telemetry") {
    setTimeout(updateCharts, 50);
  }
}


// -------------------------------------------------------------
// DOM Ready Bootstrap
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initCharts();
  connectWebSocket();
  console.log("TerraMesh AI Command Center Initialized.");
});
