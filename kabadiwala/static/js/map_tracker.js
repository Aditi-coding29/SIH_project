/**
 * map_tracker.js - Interactive Leaflet Map & 10-Stage Waste Journey Tracker
 * Closed-Loop Verification Telemetry
 * map_tracker.js - Interactive Leaflet Map & 10-Stage E-Waste Journey Tracker
 * Complete Traceability: Street Collection -> Material Lot -> Weighbridge -> Formal Recycling
 */

let trackingMap = null;
let mapMarkers = [];
let routePolyline = null;
let currentTrackingData = null;
let currentTrackingLot = null;

const stageIcons = {
  1: "clipboard-list",
  2: "user-check",
  3: "navigation",
  4: "scale",
  5: "truck",
  6: "warehouse",
  7: "send",
  8: "factory",
  9: "badge-check",
  10: "award"
const eWasteStageIcons = {
  1: "package-search",
  2: "scissors",
  3: "tag",
  4: "trending-up",
  5: "network",
  6: "file-signature",
  7: "truck",
  8: "warehouse",
  9: "scale",
  10: "badge-check"
};

async function openTrackingModal(pickupId) {
  const modal = document.getElementById('trackingModal');
async function openLotTrackingModal(lotId) {
  const modal = document.getElementById('lotTrackingModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  try {
    const res = await fetch(`/api/tracking/${pickupId}`);
    const res = await fetch(`/api/tracking/${lotId}`);
    const data = await res.json();
    if (data.status === 'success') {
      currentTrackingData = data;
      renderTrackingTimeline(data);
      initOrUpdateMap(data);
      currentTrackingLot = data;
      renderLotTrackingTimeline(data);
      initOrUpdateLotMap(data);
    }
  } catch (err) {
    console.error('Failed to load tracking info:', err);
  }
}

function renderTrackingTimeline(data) {
  const codeEl = document.getElementById('trackPickupCode');
  const userEl = document.getElementById('trackUserName');
  const kabEl = document.getElementById('trackKabadiwalaName');
  const timelineContainer = document.getElementById('trackingTimelineContainer');
function renderLotTrackingTimeline(data) {
  const codeEl = document.getElementById('trackLotCode');
  const matEl = document.getElementById('trackLotMaterial');
  const colEl = document.getElementById('trackCollectorName');
  const recEl = document.getElementById('trackRecyclerName');
  const timelineContainer = document.getElementById('lotTimelineContainer');

  if (codeEl) codeEl.innerText = data.pickup.pickup_code;
  if (userEl) userEl.innerText = `${data.pickup.user_name} (${data.pickup.pickup_address})`;
  if (kabEl) {
    kabEl.innerText = data.pickup.kabadiwala_name ? `${data.pickup.kabadiwala_name} (${data.pickup.kabadiwala_phone})` : 'Awaiting Partner Assignment';
  if (codeEl) codeEl.innerText = data.lot.lot_code;
  if (matEl) matEl.innerText = `${data.lot.subcategory_name} (${data.lot.actual_weight || data.lot.estimated_weight} ${data.lot.unit})`;
  if (colEl) colEl.innerText = `${data.lot.collector_name} (${data.lot.collector_code})`;
  if (recEl) {
    recEl.innerText = data.lot.recycler_name ? `${data.lot.recycler_name} (${data.lot.recycler_code})` : 'Awaiting Recycler Matching';
  }

  if (!timelineContainer) return;
  timelineContainer.innerHTML = '';

  const stages = data.stages || [];
  stages.forEach((s) => {
    const isCompleted = s.status === 'completed';
    const isCurrent = s.status === 'current';
    const isPending = s.status === 'pending';

    let badgeClass = "bg-slate-100 text-slate-400 border-slate-200";
    let statusText = t('stageStatusPending');
    let dotClass = "bg-slate-300 border-white";
    let statusText = "PENDING";
    let iconBg = "bg-slate-200 border-slate-300 text-slate-500";

    if (isCompleted) {
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      statusText = t('stageStatusDone');
      dotClass = "bg-emerald-500 border-emerald-100 ring-4 ring-emerald-50";
      statusText = "VERIFIED";
      iconBg = "bg-emerald-600 border-emerald-200 text-white";
    } else if (isCurrent) {
      badgeClass = "bg-amber-50 text-amber-800 border-amber-300 animate-pulse font-semibold";
      statusText = t('stageStatusCurrent');
      dotClass = "bg-amber-500 border-white ring-4 ring-amber-200 animate-ping";
      badgeClass = "bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse";
      statusText = "IN PROGRESS";
      iconBg = "bg-amber-500 border-amber-300 text-white animate-bounce";
    }

    const item = document.createElement('div');
    item.className = "relative flex items-start gap-4 pb-6 group last:pb-0";
    item.className = "relative flex items-start gap-4 pb-5 group last:pb-0";
    item.innerHTML = `
      <!-- Connecting Line -->
      <div class="absolute left-4 top-8 -bottom-2 w-0.5 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'} group-last:hidden"></div>
      
      <!-- Stage Icon Dot -->
      <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 text-white shadow-sm shrink-0 ${isCompleted ? 'bg-emerald-600 border-emerald-200' : isCurrent ? 'bg-amber-500 border-amber-300' : 'bg-slate-200 border-slate-300'}">
        <i data-lucide="${stageIcons[s.stage_number] || 'circle'}" class="w-4 h-4"></i>
      <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-sm shrink-0 ${iconBg}">
        <i data-lucide="${eWasteStageIcons[s.stage_number] || 'circle'}" class="w-4 h-4"></i>
      </div>

      <!-- Stage Details -->
      <div class="flex-1 min-w-0 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h4 class="text-sm font-bold ${isCurrent ? 'text-amber-800' : isCompleted ? 'text-slate-800' : 'text-slate-400'}">
          <h4 class="text-xs font-bold ${isCurrent ? 'text-amber-800' : isCompleted ? 'text-slate-800' : 'text-slate-400'}">
            Stage ${s.stage_number}: ${s.stage_name}
          </h4>
          <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}">
          <span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}">
            ${statusText}
          </span>
        </div>
        <p class="text-xs text-slate-500 flex items-center gap-1">
        <p class="text-[11px] text-slate-500 flex items-center gap-1">
          <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${s.location_name}
        </p>
      </div>
    `;
    timelineContainer.appendChild(item);
  });

  if (window.lucide) lucide.createIcons();
}

function initOrUpdateMap(data) {
  const mapDiv = document.getElementById('trackingLeafletMap');
function initOrUpdateLotMap(data) {
  const mapDiv = document.getElementById('lotLeafletMap');
  if (!mapDiv) return;

  // Initialize Leaflet map if not created yet
  if (!trackingMap) {
    trackingMap = L.map('trackingLeafletMap', {
    trackingMap = L.map('lotLeafletMap', {
      zoomControl: true,
      attributionControl: false
    }).setView([28.62, 77.06], 12);
    }).setView([28.65, 77.06], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(trackingMap);
  }

  // Clear existing markers
  mapMarkers.forEach(m => trackingMap.removeLayer(m));
  mapMarkers = [];
  if (routePolyline) trackingMap.removeLayer(routePolyline);

  const stages = data.stages || [];
  if (stages.length === 0) return;

  const latlngs = stages.map(s => [s.lat, s.lng]);

  // Draw polyline connecting stages
  routePolyline = L.polyline(latlngs, {
    color: '#10b981',
    color: '#059669',
    weight: 4,
    opacity: 0.7,
    dashArray: '6, 8',
    opacity: 0.8,
    dashArray: '5, 8',
    lineCap: 'round'
  }).addTo(trackingMap);

  // Add Key Waypoints
  stages.forEach((s) => {
    // Only place markers on distinct locations
    if ([1, 3, 6, 8].includes(s.stage_number) || s.status === 'current') {
    if ([1, 3, 5, 8, 10].includes(s.stage_number) || s.status === 'current') {
      let iconColor = '#64748b';
      let iconBg = '#ffffff';
      if (s.stage_number === 1) iconColor = '#3b82f6'; // Collection Source
      else if (s.stage_number === 3) iconColor = '#059669'; // Collector Hub
      else if (s.stage_number === 5) iconColor = '#f59e0b'; // Matching Hub
      else if (s.stage_number >= 8) iconColor = '#8b5cf6'; // Recycler MRF

      if (s.stage_number === 1) { // User home
        iconColor = '#10b981';
      } else if (s.stage_number === 3 || s.status === 'current') { // Moving vehicle
        iconColor = '#f59e0b';
      } else if (s.stage_number === 6) { // Aggregation Hub
        iconColor = '#3b82f6';
      } else if (s.stage_number >= 8) { // Recycler
        iconColor = '#8b5cf6';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${iconColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2.5px solid white;">
            <span style="font-size: 13px; font-weight: bold;">${s.stage_number}</span>
          <div style="background-color: ${iconColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid white;">
            <span style="font-size: 11px; font-weight: 800;">${s.stage_number}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon })
        .bindPopup(`<b>Stage ${s.stage_number}: ${s.stage_name}</b><br><span style="font-size:11px; color:#64748b">${s.location_name}</span>`)
        .addTo(trackingMap);

      mapMarkers.push(marker);

      if (s.status === 'current') {
        marker.openPopup();
      }
      if (s.status === 'current') marker.openPopup();
    }
  });

  // Fit bounds to show route
  trackingMap.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });

  // Invalidate size in case modal just opened
  setTimeout(() => {
    trackingMap.invalidateSize();
  }, 250);
}

async function simulateAdvanceStage() {
  if (!currentTrackingData) return;
  const pickupId = currentTrackingData.pickup.id;
  let curr = currentTrackingData.current_stage || 1;
  let next = curr + 1;
  if (next > 10) next = 1;

  const stageStatuses = [
    'requested', 'accepted', 'arriving', 'collected', 'in_transit',
    'delivered_hub', 'sent_to_recycler', 'recycler_received', 'verified', 'completed'
  ];
  const newStatus = stageStatuses[next - 1];

  try {
    const res = await fetch(`/api/pickups/${pickupId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, kabadiwala_id: 1 })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast(`Milestone Advanced to Stage ${next}: ${newStatus.toUpperCase()}`, 'info');
      openTrackingModal(pickupId);
      if (typeof loadUserData === 'function') loadUserData();
      if (typeof loadKabadiwalaData === 'function') loadKabadiwalaData();
    }
  } catch (err) {
    console.error(err);
  }
}

