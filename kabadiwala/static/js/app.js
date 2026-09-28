/**
 * app.js - Main Application Controller for Kabadiwala Connect
 * Handles Role Switching, Dashboards, Modals, Weighing Settlement, and Recycler Verification
 * app.js - Main Controller for Kabadiwala Connect (Informal E-Waste Collector Platform)
 * Smart India Hackathon Prototype
 */

let activeRole = 'landing'; // 'landing', 'user', 'kabadiwala', 'admin', 'recycler'
let currentUser = null;
let currentKabadiwala = null;
let currentFund = null;
let activeRole = 'collector'; // 'collector', 'recycler', 'generator', 'admin', 'landing'
let currentCollector = null;
let currentRecycler = null;
let allCategories = [];
let categoryChartInstance = null;
let trendChartInstance = null;
let activeDiscoverySubCode = 'pcb_mixed';
let activeLotForHandover = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  await fetchSessionAndData();
  await fetchSessionAndCategories();
  setupRoleSwitcher();
  setupEventListeners();
  if (window.lucide) lucide.createIcons();
});

async function fetchSessionAndData() {
async function fetchSessionAndCategories() {
  try {
    const res = await fetch('/api/auth/current');
    const data = await res.json();
    if (data.status === 'success') {
      currentUser = data.user;
      currentKabadiwala = data.kabadiwala;
      currentFund = data.fund;
      window.currentUser = currentUser;
      window.currentKabadiwala = currentKabadiwala;
      currentCollector = data.collector;
      currentRecycler = data.recycler;
      window.currentCollector = currentCollector;
    }

    const catRes = await fetch('/api/categories');
    const catData = await catRes.json();
    if (catData.status === 'success') {
      allCategories = catData.categories;
      renderLiveRateTicker(allCategories);
      populateCategorySelects();
      renderCategoryChips();
    }

    // Refresh whichever dashboard is visible
    if (activeRole === 'user') loadUserData();
    if (activeRole === 'kabadiwala') loadKabadiwalaData();
    if (activeRole === 'admin' || activeRole === 'recycler') loadAdminData();
    // Load active view
    switchRoleView(activeRole);

  } catch (err) {
    console.error('Initialization error:', err);
  }
}

// ==========================================
// ROLE SWITCHING (FOR SIH JUDGES & EVALUATION)
// ROLE SWITCHER (FOR SIH JUDGES & EVALUATION)
// ==========================================

function setupRoleSwitcher() {
  document.querySelectorAll('.role-switcher-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
    btn.addEventListener('click', () => {
      const targetRole = btn.getAttribute('data-role');
      switchRoleView(targetRole);
    });
  });
}

function switchRoleView(role) {
  activeRole = role;

  // Highlight active button in top demo bar
  // Update top switcher active button styles
  document.querySelectorAll('.role-switcher-btn').forEach(b => {
    if (b.getAttribute('data-role') === role) {
      b.classList.add('bg-emerald-600', 'text-white', 'shadow-sm');
      b.classList.remove('bg-white', 'text-slate-700');
    } else {
      b.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm');
      b.classList.add('bg-white', 'text-slate-700');
    }
  });

  // Toggle View Sections
  // Hide all views
  const landingSec = document.getElementById('viewLanding');
  const userSec = document.getElementById('viewUserDashboard');
  const kabSec = document.getElementById('viewKabadiwalaDashboard');
  const collectorSec = document.getElementById('viewCollectorDashboard');
  const recyclerSec = document.getElementById('viewRecyclerDashboard');
  const generatorSec = document.getElementById('viewGeneratorDashboard');
  const adminSec = document.getElementById('viewAdminDashboard');

  if (landingSec) landingSec.classList.add('hidden');
  if (userSec) userSec.classList.add('hidden');
  if (kabSec) kabSec.classList.add('hidden');
  if (collectorSec) collectorSec.classList.add('hidden');
  if (recyclerSec) recyclerSec.classList.add('hidden');
  if (generatorSec) generatorSec.classList.add('hidden');
  if (adminSec) adminSec.classList.add('hidden');

  if (role === 'landing' && landingSec) {
    landingSec.classList.remove('hidden');
  } else if (role === 'user' && userSec) {
    userSec.classList.remove('hidden');
    loadUserData();
  } else if (role === 'kabadiwala' && kabSec) {
    kabSec.classList.remove('hidden');
    loadKabadiwalaData();
  } else if ((role === 'admin' || role === 'recycler') && adminSec) {
  } else if (role === 'collector' && collectorSec) {
    collectorSec.classList.remove('hidden');
    loadCollectorData();
  } else if (role === 'recycler' && recyclerSec) {
    recyclerSec.classList.remove('hidden');
    loadRecyclerData();
  } else if (role === 'generator' && generatorSec) {
    generatorSec.classList.remove('hidden');
    loadGeneratorData();
  } else if (role === 'admin' && adminSec) {
    adminSec.classList.remove('hidden');
    loadAdminData();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// USER DASHBOARD CONTROLLER
// COLLECTOR DASHBOARD (PRIMARY PORTAL)
// ==========================================

async function loadUserData() {
  if (!currentUser) return;
async function loadCollectorData() {
  if (!currentCollector) return;
  try {
    const res = await fetch(`/api/stats/user/${currentUser.id}`);
    const res = await fetch(`/api/stats/collector/${currentCollector.id}`);
    const data = await res.json();
    if (data.status !== 'success') return;

    // Profile Card
    const nameEl = document.getElementById('uProfileName');
    const codeEl = document.getElementById('uProfileCode');
    const maskedEl = document.getElementById('uProfileMaskedId');
    const phoneEl = document.getElementById('uProfilePhone');
    const addrEl = document.getElementById('uProfileAddress');
    const levelBadge = document.getElementById('uEcoLevelBadge');
    document.getElementById('cProfileName').innerText = data.collector.name;
    document.getElementById('cProfileCode').innerText = data.collector.collector_code;
    document.getElementById('cProfileMaskedId').innerText = data.collector.masked_id;
    document.getElementById('cProfileArea').innerText = data.collector.service_area;
    document.getElementById('cTrustScoreBadge').innerText = `${data.collector.trust_score}/100`;

    if (nameEl) nameEl.innerText = data.user.name;
    if (codeEl) codeEl.innerText = data.user.user_code;
    if (maskedEl) maskedEl.innerText = `Aadhaar: ${data.user.masked_id}`;
    if (phoneEl) phoneEl.innerText = data.user.phone;
    if (addrEl) addrEl.innerText = data.user.address;
    if (levelBadge) {
      levelBadge.innerText = data.eco_level;
      levelBadge.className = `px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getEcoLevelClass(data.eco_level)}`;
    }
    // 6 Summary Metrics
    const s = data.summary;
    document.getElementById('cActiveLotsCount').innerText = s.active_lots;
    document.getElementById('cTotalCollectedKg').innerText = `${s.total_collected_kg} kg`;
    document.getElementById('cVerifiedDeliveredKg').innerText = `${s.verified_ewaste_kg} kg`;
    document.getElementById('cGrossSales').innerText = `₹${s.gross_sales_inr.toLocaleString('en-IN')}`;
    document.getElementById('cGrossMargin').innerText = `₹${s.gross_margin_inr.toLocaleString('en-IN')}`;
    document.getElementById('cGreenPoints').innerText = s.green_points;

    // Key Stat Cards
    document.getElementById('uTotalWasteRecycled').innerText = `${data.total_weight_recycled} kg`;
    document.getElementById('uTotalGreenPoints').innerText = data.user.green_points;
    document.getElementById('uTotalCashback').innerText = `₹${data.user.cashback_earned.toFixed(2)}`;
    document.getElementById('uTotalVerifiedPickups').innerText = data.verified_pickups_count;
    // Financial Margins Breakdown
    document.getElementById('cMarginProcCost').innerText = `₹${s.procurement_cost_inr.toFixed(2)}`;
    document.getElementById('cMarginRecSales').innerText = `₹${s.gross_sales_inr.toFixed(2)}`;
    document.getElementById('cMarginGrossProfit').innerText = `+₹${s.gross_margin_inr.toFixed(2)}`;
    document.getElementById('cMarginExpenses').innerText = `₹${s.operating_expenses_inr.toFixed(2)}`;
    document.getElementById('cMarginNetEarnings').innerText = `₹${s.net_earnings_inr.toFixed(2)}`;

    // Environmental Equivalencies
    const co2El = document.getElementById('uCo2Saved');
    const treesEl = document.getElementById('uTreesSaved');
    const waterEl = document.getElementById('uWaterSaved');
    if (co2El) co2El.innerText = `${data.total_co2_saved_kg} kg`;
    if (treesEl) treesEl.innerText = `${data.trees_saved} trees`;
    if (waterEl) waterEl.innerText = `${data.total_water_saved_l} L`;
    // Load Material Lots
    loadCollectorLots();

    // Active Pickups
    loadUserActivePickups();

    // Category Distribution Chart
    renderCategoryChart(data.category_breakdown);

    // Transaction History
    renderUserTransactions(data.transactions);

  } catch (err) {
    console.error('Failed to load user data:', err);
    console.error('Failed to load collector data:', err);
  }
}

async function loadUserActivePickups() {
  if (!currentUser) return;
async function loadCollectorLots(filterStatus = null) {
  if (!currentCollector) return;
  try {
    const res = await fetch(`/api/pickups?user_id=${currentUser.id}`);
    let url = `/api/lots?collector_id=${currentCollector.id}`;
    if (filterStatus) url += `&status=${filterStatus}`;

    const res = await fetch(url);
    const data = await res.json();
    const container = document.getElementById('userActivePickupsContainer');
    const emptyNotice = document.getElementById('userNoActivePickupsNotice');
    const container = document.getElementById('collectorLotsContainer');
    if (!container) return;

    container.innerHTML = '';
    const active = (data.pickups || []).filter(p => p.status !== 'verified' && p.status !== 'cancelled');
    const lots = data.lots || [];

    if (active.length === 0) {
      if (emptyNotice) emptyNotice.classList.remove('hidden');
      return;
    }
    if (emptyNotice) emptyNotice.classList.add('hidden');

    active.forEach(p => {
      const card = document.createElement('div');
      card.className = "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all";
      
      const itemsList = p.items.map(i => `<span class="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 mr-1">${i.name_en}: ${i.estimated_weight} kg</span>`).join('');

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-emerald-800">${p.pickup_code}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}">${p.status.toUpperCase()}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Preferred Slot: ${p.preferred_time}</p>
          </div>
          <button onclick="openTrackingModal(${p.id})" class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
            <i data-lucide="map-pin" class="w-4 h-4"></i> Track Waste Journey
    if (lots.length === 0) {
      container.innerHTML = `
        <div class="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
          <i data-lucide="package" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="text-xs font-semibold">No material lots found in this category.</p>
          <button onclick="openModal('createLotModal')" class="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700">
            Create First E-Waste Lot
          </button>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span class="text-slate-400">Waste Items:</span>
            <div class="mt-1">${itemsList}</div>
          </div>
          <div class="text-right">
            <span class="text-slate-400">Est. Value:</span>
            <span class="font-bold text-slate-800 text-sm ml-1">₹${p.total_estimated_value.toFixed(2)}</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function renderCategoryChart(breakdown) {
  const canvas = document.getElementById('userCategoryChart');
  if (!canvas) return;

  const validData = (breakdown || []).filter(b => b.weight_recycled > 0);
  const labels = validData.length > 0 ? validData.map(b => b.name_en) : ['Plastic', 'Cardboard', 'Metal'];
  const dataValues = validData.length > 0 ? validData.map(b => b.weight_recycled) : [12.0, 8.0, 7.5];
  const bgColors = validData.length > 0 ? validData.map(b => b.color || '#10b981') : ['#10b981', '#f59e0b', '#ef4444'];

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      },
      cutout: '70%'
    }
  });
}

function renderUserTransactions(txns) {
  const tbody = document.getElementById('userTransactionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!txns || txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 text-xs">No transactions recorded yet. Book your first pickup!</td></tr>`;
    return;
  }

  txns.forEach(t => {
    const row = document.createElement('tr');
    row.className = "border-b border-slate-100 hover:bg-slate-50/70 text-xs";
    
    const verifiedBadge = t.recycler_verified 
      ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><i data-lucide="check-check" class="w-3 h-3"></i> Verified ✓</span>`
      : `<span class="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><i data-lucide="clock" class="w-3 h-3"></i> At Recovery Hub</span>`;

    row.innerHTML = `
      <td class="py-3 px-3 font-mono font-semibold text-slate-800">${t.transaction_code}</td>
      <td class="py-3 px-3 text-slate-500">${t.created_at.split(' ')[0]}</td>
      <td class="py-3 px-3 font-medium text-slate-700">${t.total_weight} kg</td>
      <td class="py-3 px-3 font-bold text-slate-800">₹${t.total_amount.toFixed(2)}</td>
      <td class="py-3 px-3">${verifiedBadge}</td>
      <td class="py-3 px-3">
        <span class="text-emerald-700 font-bold">+${t.green_points_awarded} pts</span>
        <span class="text-slate-400 text-[10px] block">(₹${t.cashback_awarded.toFixed(2)} CB)</span>
      </td>
      <td class="py-3 px-3 text-right">
        <button onclick="openReceiptModal('${t.transaction_code}')" class="text-emerald-700 hover:underline font-semibold">Receipt</button>
        <button onclick="openRatingModal(${t.pickup_id})" class="ml-2 text-amber-600 hover:underline font-semibold">Rate</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// KABADIWALA DASHBOARD CONTROLLER
// ==========================================

async function loadKabadiwalaData() {
  if (!currentKabadiwala) return;
  try {
    const res = await fetch(`/api/stats/kabadiwala/${currentKabadiwala.id}`);
    const data = await res.json();
    if (data.status !== 'success') return;

    // Profile Card
    const nameEl = document.getElementById('kProfileName');
    const codeEl = document.getElementById('kProfileCode');
    const areaEl = document.getElementById('kProfileServiceArea');
    const ratingEl = document.getElementById('kProfileRating');
    const maskedEl = document.getElementById('kProfileMaskedId');

    if (nameEl) nameEl.innerText = data.kabadiwala.name;
    if (codeEl) codeEl.innerText = data.kabadiwala.kabadiwala_code;
    if (areaEl) areaEl.innerText = data.kabadiwala.service_area;
    if (ratingEl) ratingEl.innerText = `${data.kabadiwala.rating} ★ (${data.kabadiwala.rating_count} reviews)`;
    if (maskedEl) maskedEl.innerText = `Govt Ref: ${data.kabadiwala.masked_id}`;

    // Today's Summary
    const s = data.summary;
    document.getElementById('kNewRequestsCount').innerText = s.new_requests;
    document.getElementById('kAcceptedPickupsCount').innerText = s.accepted_pickups;
    document.getElementById('kCompletedPickupsCount').innerText = s.completed_pickups;
    document.getElementById('kTotalCollectedKg').innerText = `${s.total_waste_collected_kg} kg`;
    document.getElementById('kVerifiedAtRecycler').innerText = `${s.verified_at_recycler_kg} kg`;
    document.getElementById('kGreenPoints').innerText = data.kabadiwala.green_points;

    // Commercial Margins & Earnings Section
    document.getElementById('kProcurementCost').innerText = `₹${s.total_procurement_cost_inr.toFixed(2)}`;
    document.getElementById('kRecyclerRevenue').innerText = `₹${s.total_recycler_revenue_inr.toFixed(2)}`;
    document.getElementById('kGrossMargin').innerText = `₹${s.gross_margin_inr.toFixed(2)}`;
    document.getElementById('kOperatingExpenses').innerText = `₹${s.operating_expenses_inr.toFixed(2)}`;
    document.getElementById('kNetEarnings').innerText = `₹${s.estimated_net_earnings_inr.toFixed(2)}`;

    // Incoming Requests
    loadKabadiwalaRequests();

    // Aggregated Inventory Stock
    loadKabadiwalaInventory();

  } catch (err) {
    console.error('Failed to load kabadiwala data:', err);
  }
}

async function loadKabadiwalaRequests() {
  if (!currentKabadiwala) return;
  try {
    const res = await fetch(`/api/pickups?kabadiwala_id=${currentKabadiwala.id}`);
    const data = await res.json();
    const list = document.getElementById('kabadiwalaPickupsList');
    if (!list) return;

    list.innerHTML = '';
    const pickups = data.pickups || [];

    if (pickups.length === 0) {
      list.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No new requests in your service area right now.</div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    pickups.forEach(p => {
    lots.forEach(lot => {
      const card = document.createElement('div');
      card.className = "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all";
      

      let statusBadge = '';
      let actionButtons = '';
      if (p.status === 'requested') {

      if (lot.status === 'verified') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ RECYCLING VERIFIED</span>`;
        actionButtons = `
          <button onclick="acceptPickupRequest(${p.id})" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">
            Accept Pickup
          <button onclick="openLotTrackingModal(${lot.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1">
            <i data-lucide="map" class="w-3.5 h-3.5"></i> Traceability Log
          </button>
        `;
      } else if (p.status === 'accepted') {
      } else if (lot.status === 'handover_scheduled' || lot.status === 'in_transit') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">En Route to Recycler</span>`;
        actionButtons = `
          <button onclick="updatePickupStage(${p.id}, 'arriving')" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors">
            Start Journey (Arriving)
          <button onclick="openLotTrackingModal(${lot.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1">
            <i data-lucide="truck" class="w-3.5 h-3.5"></i> Track Consignment
          </button>
        `;
      } else if (p.status === 'arriving') {
      } else if (lot.status === 'aggregated') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Bulk Merged</span>`;
        actionButtons = `
          <button onclick="openWeighingModal(${p.id})" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1">
            <i data-lucide="scale" class="w-4 h-4"></i> Weigh & Settle Pay
          <button onclick="openLotTrackingModal(${lot.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100">
            View
          </button>
        `;
      } else {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Awaiting Recycler</span>`;
        actionButtons = `
          <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Collected & Weighed
          </span>
          <button onclick="openPriceDiscoveryForLot(${lot.id}, '${lot.subcategory_code}', ${lot.actual_weight || lot.estimated_weight})" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1">
            <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> Price Discovery & Match
          </button>
          <button onclick="openLotTrackingModal(${lot.id})" class="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200" title="Milestones">
            <i data-lucide="clock" class="w-4 h-4"></i>
          </button>
        `;
      }

      const itemsDetail = p.items.map(i => `
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
          <span class="text-slate-700 font-medium">${i.name_en}</span>
          <span class="text-slate-500">Est. ${i.estimated_weight} kg @ ₹${i.rate_per_kg}/kg</span>
          <span class="font-bold text-slate-800">₹${(i.estimated_weight * i.rate_per_kg).toFixed(2)}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-emerald-800 text-sm">${p.pickup_code}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}">${p.status.toUpperCase()}</span>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs" style="background-color: ${lot.color || '#10b981'}">
              ${lot.category_code.toUpperCase()}
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1">
              <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i> ${p.user_name} (${p.user_phone})
            </p>
            <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i> ${p.pickup_address}
            </p>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm text-slate-900">${lot.lot_code}</span>
                ${statusBadge}
              </div>
              <h4 class="font-bold text-xs text-slate-700 mt-0.5">${lot.subcategory_name}</h4>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${actionButtons}
            <button onclick="openTrackingModal(${p.id})" class="p-2 rounded-xl text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 transition-colors" title="Track">
              <i data-lucide="map" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Manifested Items Quote</p>
          ${itemsDetail}
          <div class="flex justify-between items-center pt-2 mt-1 border-t border-slate-200 text-xs font-bold text-slate-800">
            <span>Total Est. Weight: ${p.total_estimated_weight} kg</span>
            <span class="text-emerald-700">Total Est. Pay: ₹${p.total_estimated_value.toFixed(2)}</span>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px]">Verified Weight</span>
            <span class="font-black text-slate-800 text-sm">${lot.actual_weight || lot.estimated_weight} ${lot.unit}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Condition Grade</span>
            <span class="font-semibold text-slate-700">${lot.condition}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Source</span>
            <span class="font-medium text-slate-600 truncate block">${lot.source_type}</span>
          </div>
          <div class="text-right sm:text-right">
            <span class="text-slate-400 block text-[10px]">Procurement Cost</span>
            <span class="font-bold text-slate-800">₹${lot.procurement_cost.toFixed(2)}</span>
          </div>
        </div>
      `;
      list.appendChild(card);
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error(err);
  }
}

async function loadKabadiwalaInventory() {
  if (!currentKabadiwala) return;
// ==========================================
// PRICE DISCOVERY & RECYCLER MATCHING MODAL
// ==========================================

async function openPriceDiscoveryForLot(lotId, subCode, weight) {
  activeLotForHandover = { id: lotId, subCode, weight };
  activeDiscoverySubCode = subCode;

  const modal = document.getElementById('priceDiscoveryModal');
  if (modal) modal.classList.remove('hidden');

  await loadPriceDiscoveryData(subCode, weight);
}

async function loadPriceDiscoveryData(subCode, lotWeight = 20.0) {
  try {
    const res = await fetch(`/api/kabadiwala/${currentKabadiwala.id}/inventory`);
    const res = await fetch(`/api/price-discovery?subcategory_code=${subCode}`);
    const data = await res.json();
    const container = document.getElementById('kabadiwalaInventoryGrid');
    if (!container) return;
    if (data.status !== 'success') return;

    container.innerHTML = '';
    const inventory = data.inventory || [];
    // Subcategory details
    document.getElementById('discSubName').innerText = data.subcategory.name_en;
    document.getElementById('discMarketMin').innerText = `₹${data.market_range.min}`;
    document.getElementById('discMarketMax').innerText = `₹${data.market_range.max} / ${data.market_range.unit}`;
    document.getElementById('discHistAvg').innerText = `₹${data.market_range.historical_avg} / ${data.market_range.unit}`;

    inventory.forEach(item => {
      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-sm text-slate-800">${item.name_en}</span>
            <span class="w-7 h-7 rounded-lg text-white text-xs flex items-center justify-center font-bold" style="background-color: ${item.color || '#10b981'}">
              ${item.code.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div class="text-2xl font-black text-slate-900 mb-1">${item.total_weight_collected} <span class="text-xs font-normal text-slate-500">kg in stock</span></div>
          <div class="text-xs text-slate-500 flex justify-between">
            <span>Bought @ ₹${item.user_rate_per_kg}/kg</span>
            <span class="font-semibold text-emerald-600">Recycler @ ₹${item.recycler_rate_per_kg}/kg</span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span class="text-slate-400">Projected Margin:</span>
          <span class="font-bold text-emerald-700">+₹${item.projected_margin}</span>
        </div>
      `;
      container.appendChild(card);
    });
    // Render Historical Price Trend Chart
    renderHistoricalPriceChart(data.historical_trend);

    // Update aggregate totals
    const totalWtEl = document.getElementById('kInvTotalWeight');
    const totalRevEl = document.getElementById('kInvRecyclerVal');
    const totalMarginEl = document.getElementById('kInvGrossMargin');
    // Call Recycler Matching Engine
    loadRecyclerMatches(subCode, lotWeight);

    if (totalWtEl) totalWtEl.innerText = `${data.total_weight_kg} kg`;
    if (totalRevEl) totalRevEl.innerText = `₹${data.total_recycler_value_inr}`;
    if (totalMarginEl) totalMarginEl.innerText = `₹${data.projected_gross_margin_inr}`;

  } catch (err) {
    console.error(err);
  }
}

async function acceptPickupRequest(pickupId) {
  try {
    const res = await fetch(`/api/pickups/${pickupId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', kabadiwala_id: currentKabadiwala.id })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pickup Accepted! Status updated on user tracking map.', 'success');
      loadKabadiwalaData();
function renderHistoricalPriceChart(trendData) {
  const canvas = document.getElementById('priceTrendChart');
  if (!canvas) return;

  const labels = (trendData || []).map(d => d.date.split('-').slice(1).join('/'));
  const prices = (trendData || []).map(d => d.price_per_kg);

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Market Price (₹/kg)',
        data: prices,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#059669'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          ticks: { font: { size: 10 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
  });
}

async function updatePickupStage(pickupId, status) {
async function loadRecyclerMatches(subCode, lotWeight) {
  try {
    const res = await fetch(`/api/pickups/${pickupId}/status`, {
    const res = await fetch('/api/recyclers/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status, kabadiwala_id: currentKabadiwala.id })
      body: JSON.stringify({ subcategory_code: subCode, weight: lotWeight })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Pickup status updated to: ${status.toUpperCase()}`, 'info');
      loadKabadiwalaData();
    }
  } catch (err) {
    console.error(err);
  }
}
    const container = document.getElementById('recyclerBidsContainer');
    if (!container) return;

// ==========================================
// ACTUAL WEIGHING & FAIR PAYMENT MODAL
// ==========================================
    container.innerHTML = '';
    const recs = data.recommendations || [];

let activeWeighingPickup = null;
    if (recs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No active authorized recyclers found for this subcategory.</div>`;
      return;
    }

async function openWeighingModal(pickupId) {
  try {
    const res = await fetch(`/api/tracking/${pickupId}`);
    const data = await res.json();
    if (data.status !== 'success') return;

    activeWeighingPickup = data.pickup;
    activeWeighingPickup.items = data.items;

    const modal = document.getElementById('weighingModal');
    const pickupCodeEl = document.getElementById('weighPickupCode');
    const userNameEl = document.getElementById('weighUserName');
    const itemsContainer = document.getElementById('weighItemsContainer');

    if (pickupCodeEl) pickupCodeEl.innerText = activeWeighingPickup.pickup_code;
    if (userNameEl) userNameEl.innerText = `${activeWeighingPickup.user_name} (${activeWeighingPickup.pickup_address})`;

    itemsContainer.innerHTML = '';
    activeWeighingPickup.items.forEach((item, idx) => {
    recs.forEach(r => {
      const row = document.createElement('div');
      row.className = "p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3";
      row.className = "p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500 transition-all";
      row.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
            ${item.category_code.slice(0, 2).toUpperCase()}
        <div>
          <div class="flex items-center gap-2">
            <h5 class="font-bold text-xs text-slate-900">${r.name}</h5>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              ${r.license_no}
            </span>
          </div>
          <div>
            <h5 class="font-bold text-sm text-slate-800">${item.name_en}</h5>
            <p class="text-xs text-slate-500">Est: ${item.estimated_weight} kg | Rate: ₹${item.rate_per_kg}/kg</p>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5">
            📍 ${r.facility_location} • Min Qty: ${r.min_quantity_kg} kg
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <label class="text-xs font-bold text-slate-600">Actual Weight:</label>
            <input type="number" step="0.1" min="0.1" value="${item.estimated_weight}" id="weighInput_${idx}" oninput="recalculateWeighingTotals()" class="w-24 p-2 rounded-lg border border-slate-300 font-bold text-slate-800 text-center focus:ring-2 focus:ring-emerald-500">
            <span class="text-xs text-slate-500 font-medium">kg</span>
          <div class="text-right">
            <span class="text-[10px] text-slate-400 block">Offer Rate</span>
            <span class="text-sm font-black text-emerald-700">₹${r.offered_rate_per_kg} <span class="text-[10px] font-normal text-slate-500">/kg</span></span>
          </div>
          <div class="text-right min-w-[70px]">
            <span class="text-xs text-slate-400 block">Subtotal</span>
            <span class="font-bold text-emerald-700 text-sm" id="weighSubtotal_${idx}">₹${(item.estimated_weight * item.rate_per_kg).toFixed(2)}</span>
          <div class="text-center px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
            <span class="text-[9px] text-emerald-600 font-bold block">Match</span>
            <span class="text-xs font-black text-emerald-800">${r.match_score}%</span>
          </div>
          <button onclick="initiateHandoverWithRecycler(${r.recycler_id}, ${r.offered_rate_per_kg})" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
            Accept & Handover
          </button>
        </div>
      `;
      itemsContainer.appendChild(row);
      container.appendChild(row);
    });

    recalculateWeighingTotals();
    modal.classList.remove('hidden');

  } catch (err) {
    console.error(err);
  }
}

function recalculateWeighingTotals() {
  if (!activeWeighingPickup || !activeWeighingPickup.items) return;
async function initiateHandoverWithRecycler(recyclerId, agreedRate) {
  if (!activeLotForHandover) return;

  let totalWeight = 0;
  let totalPay = 0;

  activeWeighingPickup.items.forEach((item, idx) => {
    const input = document.getElementById(`weighInput_${idx}`);
    const actualWt = parseFloat(input ? input.value : 0) || 0;
    const subtotal = Math.round(actualWt * item.rate_per_kg * 100) / 100;
    totalWeight += actualWt;
    totalPay += subtotal;

    const subtotalEl = document.getElementById(`weighSubtotal_${idx}`);
    if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
  });

  const totalWtEl = document.getElementById('weighTotalWeight');
  const totalPayEl = document.getElementById('weighTotalPay');
  if (totalWtEl) totalWtEl.innerText = `${totalWeight.toFixed(2)} kg`;
  if (totalPayEl) totalPayEl.innerText = `₹${totalPay.toFixed(2)}`;
}

async function submitWeighingPayment() {
  if (!activeWeighingPickup) return;

  const methodSelect = document.getElementById('weighPaymentMethodSelect');
  const paymentMethod = methodSelect ? methodSelect.value : 'UPI';

  const itemWeighings = activeWeighingPickup.items.map((item, idx) => {
    const input = document.getElementById(`weighInput_${idx}`);
    return {
      category_code: item.category_code,
      actual_weight: parseFloat(input ? input.value : 0) || 0
    };
  });

  try {
    const res = await fetch(`/api/pickups/${activeWeighingPickup.id}/weigh-and-pay`, {
    const res = await fetch('/api/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kabadiwala_id: currentKabadiwala.id,
        payment_method: paymentMethod,
        items: itemWeighings
        lot_id: activeLotForHandover.id,
        collector_id: currentCollector.id,
        recycler_id: recyclerId,
        agreed_rate_per_kg: agreedRate
      })
    });
    const result = await res.json();

    if (result.status === 'success') {
      closeModal('weighingModal');
      showToast(`🎉 Payment of ₹${result.total_amount} Confirmed via ${paymentMethod}! Scrap collected.`, 'success');
      loadKabadiwalaData();
      
      // Prompt user rating simulation
      setTimeout(() => {
        openRatingModal(activeWeighingPickup.id);
      }, 1500);
      closeModal('priceDiscoveryModal');
      showToast(`🤝 Digital Handover ${result.handover_code} Created! Total Agreed: ₹${result.total_value}`, 'success');
      loadCollectorData();
    } else {
      showToast(result.message || 'Payment settlement failed', 'error');
      showToast(result.message || 'Failed to create handover', 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// BULK CONSIGNMENT TO RECYCLER
// CREATE MATERIAL LOT FORM & MODAL
// ==========================================

function openDeliverToRecyclerModal() {
  const modal = document.getElementById('deliverRecyclerModal');
  if (modal) modal.classList.remove('hidden');
function populateCategorySelects() {
  const catSel = document.getElementById('lotCategorySelect');
  if (!catSel) return;

  catSel.innerHTML = '';
  allCategories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.innerText = c.name_en;
    catSel.appendChild(opt);
  });

  catSel.addEventListener('change', () => {
    populateSubcategoriesDropdown(catSel.value);
  });

  if (allCategories.length > 0) {
    populateSubcategoriesDropdown(allCategories[0].code);
  }
}

async function submitRecyclerDelivery() {
  const items = [
    { category_code: 'plastic', weight: 28.5 },
    { category_code: 'cardboard', weight: 34.0 },
    { category_code: 'metal', weight: 16.5 }
  ];
function populateSubcategoriesDropdown(categoryCode, defaultSubCode = null) {
  const subSel = document.getElementById('lotSubcategorySelect');
  if (!subSel) return;

  subSel.innerHTML = '';
  const cat = allCategories.find(c => c.code === categoryCode);
  if (!cat || !cat.subcategories) return;

  cat.subcategories.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.code;
    opt.innerText = `${s.name_en} (Range: ₹${s.indicative_min_price}–₹${s.indicative_max_price}/${s.unit})`;
    subSel.appendChild(opt);
  });

  if (defaultSubCode) subSel.value = defaultSubCode;
}

async function submitCreateLot() {
  const cat = document.getElementById('lotCategorySelect')?.value;
  const sub = document.getElementById('lotSubcategorySelect')?.value;
  const weight = parseFloat(document.getElementById('lotWeightInput')?.value || 0);
  const condition = document.getElementById('lotConditionSelect')?.value || 'Mixed / Unsorted';
  const source = document.getElementById('lotSourceInput')?.value || 'Local Repair Hubs';
  const procCost = parseFloat(document.getElementById('lotProcurementCostInput')?.value || 0);
  const notes = document.getElementById('lotNotesInput')?.value || '';

  if (weight <= 0) {
    showToast('Please enter a valid actual weight measured on scale.', 'warning');
    return;
  }

  const payload = {
    collector_id: currentCollector.id,
    category_code: cat,
    subcategory_code: sub,
    estimated_weight: weight,
    actual_weight: weight,
    condition: condition,
    source_type: source,
    procurement_cost: procCost,
    notes: notes,
    photo_url: window.currentScanResult ? window.currentScanResult.photo_url : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60'
  };

  try {
    const res = await fetch('/api/kabadiwala/deliver-to-recycler', {
    const res = await fetch('/api/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kabadiwala_id: currentKabadiwala.id,
        recycler_name: 'Swachh Bharat Industrial Smelters & Pulpers',
        facility_location: 'Green Belt Hub-4, Bawana Industrial Area, New Delhi',
        items: items
      })
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === 'success') {
      closeModal('deliverRecyclerModal');
      showToast(`🚚 Bulk Consignment ${data.delivery_code} Dispatched to Recycler!`, 'success');
      loadKabadiwalaData();
      closeModal('createLotModal');
      showToast(`📦 Material Lot ${data.lot_code} Created! Now compare prices with authorized recyclers.`, 'success');
      loadCollectorData();
      // Prompt price discovery immediately
      setTimeout(() => {
        openPriceDiscoveryForLot(data.lot_id, sub, weight);
      }, 900);
    } else {
      showToast(data.message || 'Error creating lot', 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// ADMIN & RECYCLER VERIFICATION PORTAL
// BULK LOT MERGING MODAL
// ==========================================

async function loadAdminData() {
async function openMergeLotsModal() {
  const modal = document.getElementById('mergeLotsModal');
  const container = document.getElementById('mergeLotsListContainer');
  if (!modal || !container) return;

  try {
    const overviewRes = await fetch('/api/admin/overview');
    const overview = await overviewRes.json();
    if (overview.status !== 'success') return;
    const res = await fetch(`/api/lots?collector_id=${currentCollector.id}&status=lot_created`);
    const data = await res.json();
    container.innerHTML = '';

    // Metrics
    const m = overview.metrics;
    document.getElementById('adminTotalUsers').innerText = m.total_users;
    document.getElementById('adminTotalKabadiwalas').innerText = m.total_kabadiwalas;
    document.getElementById('adminTotalWasteDiverted').innerText = `${m.total_diverted_kg} kg`;
    document.getElementById('adminTotalHouseholdsPaid').innerText = `₹${m.total_paid_to_households_inr.toFixed(2)}`;
    const lots = data.lots || [];
    if (lots.length < 2) {
      container.innerHTML = `<div class="p-4 text-xs text-slate-400 text-center">You need at least 2 active un-handed lots of the same category to merge.</div>`;
    } else {
      lots.forEach(l => {
        const row = document.createElement('label');
        row.className = "flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50";
        row.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" value="${l.id}" class="merge-checkbox rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4">
            <div>
              <span class="font-mono font-bold text-xs text-slate-800">${l.lot_code}</span>
              <p class="text-[11px] text-slate-500">${l.subcategory_name} (${l.actual_weight} ${l.unit})</p>
            </div>
          </div>
          <span class="font-bold text-slate-700 text-xs">${l.actual_weight} kg</span>
        `;
        container.appendChild(row);
      });
    }

    // Green Fund
    const f = overview.fund;
    document.getElementById('adminFundPool').innerText = `₹${f.total_pool_inr.toLocaleString('en-IN')}`;
    document.getElementById('adminFundDisbursed').innerText = `₹${f.cashback_disbursed_inr.toLocaleString('en-IN')}`;
    document.getElementById('adminFundSponsors').innerText = f.sponsor_names;
    modal.classList.remove('hidden');

    // Rates Table
    renderAdminRatesTable(overview.categories);

    // Recycler Consignments Table
    loadRecyclerDeliveries();

  } catch (err) {
    console.error('Failed to load admin data:', err);
    console.error(err);
  }
}

function renderAdminRatesTable(categories) {
  const tbody = document.getElementById('adminRatesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
async function submitMergeLots() {
  const checkboxes = document.querySelectorAll('.merge-checkbox:checked');
  const lotIds = Array.from(checkboxes).map(c => parseInt(c.value));

  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-100 text-xs";
    tr.innerHTML = `
      <td class="py-3 px-3">
        <span class="font-bold text-slate-800">${cat.name_en}</span>
        <span class="text-slate-400 block text-[10px]">${cat.name_hi}</span>
      </td>
      <td class="py-3 px-3">
        <div class="flex items-center gap-1">
          <span class="text-slate-400">₹</span>
          <input type="number" step="0.5" id="adminUserRate_${cat.code}" value="${cat.user_rate_per_kg}" class="w-16 p-1 rounded border border-slate-200 text-center font-bold text-slate-800">
        </div>
      </td>
      <td class="py-3 px-3">
        <div class="flex items-center gap-1">
          <span class="text-slate-400">₹</span>
          <input type="number" step="0.5" id="adminRecyclerRate_${cat.code}" value="${cat.recycler_rate_per_kg}" class="w-16 p-1 rounded border border-slate-200 text-center font-bold text-emerald-700">
        </div>
      </td>
      <td class="py-3 px-3">
        <input type="number" step="1" id="adminImpactScore_${cat.code}" value="${cat.impact_score_per_kg}" class="w-16 p-1 rounded border border-slate-200 text-center font-semibold text-slate-800">
      </td>
      <td class="py-3 px-3 text-right">
        <button onclick="saveAdminRate('${cat.code}')" class="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition-colors">
          Save
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
  if (lotIds.length < 2) {
    showToast('Select at least 2 lots to aggregate.', 'warning');
    return;
  }

async function saveAdminRate(catCode) {
  const uRate = parseFloat(document.getElementById(`adminUserRate_${catCode}`).value);
  const rRate = parseFloat(document.getElementById(`adminRecyclerRate_${catCode}`).value);
  const impact = parseFloat(document.getElementById(`adminImpactScore_${catCode}`).value);

  try {
    const res = await fetch('/api/admin/rates', {
    const res = await fetch('/api/lots/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: catCode,
        user_rate_per_kg: uRate,
        recycler_rate_per_kg: rRate,
        impact_score_per_kg: impact
      })
      body: JSON.stringify({ collector_id: currentCollector.id, lot_ids: lotIds })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast(`Updated rates for ${catCode.toUpperCase()}!`, 'success');
      fetchSessionAndData();
    const data = await res.json();

    if (data.status === 'success') {
      closeModal('mergeLotsModal');
      showToast(`🔄 Aggregated into Bulk Lot ${data.bulk_lot_code} (${data.total_weight_kg} kg)!`, 'success');
      loadCollectorData();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadRecyclerDeliveries() {
// ==========================================
// AUTHORIZED RECYCLER PORTAL
// ==========================================

async function loadRecyclerData() {
  try {
    const res = await fetch('/api/recycler/deliveries');
    const res = await fetch(`/api/handovers?recycler_id=${currentRecycler ? currentRecycler.id : 1}`);
    const data = await res.json();
    const tbody = document.getElementById('recyclerDeliveriesTableBody');
    if (!tbody) return;
    const container = document.getElementById('recyclerPendingHandovers');
    if (!container) return;

    tbody.innerHTML = '';
    const deliveries = data.deliveries || [];
    container.innerHTML = '';
    const handovers = data.handovers || [];

    if (deliveries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 text-xs">No pending consignments.</td></tr>`;
    if (handovers.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-xs text-slate-400">No pending handovers awaiting weighbridge verification.</td></tr>`;
      return;
    }

    deliveries.forEach(d => {
      const isVerified = d.status === 'verified';
      const isMismatch = d.status === 'mismatch';
    handovers.forEach(h => {
      const isVerified = h.handover_status === 'verified';
      const isMismatch = h.handover_status === 'mismatch_flagged';

      let actionBlock = '';
      if (!isVerified && !isMismatch) {
        actionBlock = `
          <div class="flex items-center justify-end gap-1">
            <button onclick="verifyDelivery(${d.id}, ${d.manifested_weight}, 'verified')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm">
              Confirm Received ✓
            </button>
            <button onclick="verifyDelivery(${d.id}, ${d.manifested_weight}, 'mismatch')" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] border border-rose-200">
              Reject
            </button>
          </div>
          <button onclick="openWeighbridgeModal(${h.id}, ${h.collector_declared_weight}, '${h.handover_code}')" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center gap-1">
            <i data-lucide="scale" class="w-3.5 h-3.5"></i> Weigh & Verify
          </button>
        `;
      } else if (isVerified) {
        actionBlock = `<span class="text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Recycling Verified ✓</span>`;
        actionBlock = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ RECYCLING VERIFIED</span>`;
      } else {
        actionBlock = `<span class="text-rose-700 font-bold text-xs bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">Mismatch Flagged</span>`;
        actionBlock = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">⚠️ Mismatch Flagged</span>`;
      }

      const row = document.createElement('tr');
      row.className = "border-b border-slate-100 text-xs";
      row.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-slate-800">${d.delivery_code}</td>
      const tr = document.createElement('tr');
      tr.className = "border-b border-slate-100 text-xs";
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-slate-800">${h.handover_code}</td>
        <td class="py-3 px-3">
          <span class="font-semibold text-slate-800">${d.kabadiwala_name}</span>
          <span class="text-slate-400 block text-[10px]">${d.kabadiwala_code}</span>
          <span class="font-bold text-slate-800">${h.collector_name}</span>
          <span class="text-slate-400 block text-[10px]">${h.collector_code} (Trust: ${h.trust_score})</span>
        </td>
        <td class="py-3 px-3 font-bold text-slate-700">${d.manifested_weight} kg</td>
        <td class="py-3 px-3 font-bold text-emerald-700">₹${d.recycler_payout.toFixed(2)}</td>
        <td class="py-3 px-3 font-bold text-amber-700">₹${d.kabadiwala_gross_margin.toFixed(2)}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(d.status)}">${d.status.toUpperCase()}</span>
        </td>
        <td class="py-3 px-3 font-semibold text-slate-700">${h.subcategory_name}</td>
        <td class="py-3 px-3 font-bold text-slate-800">${h.collector_declared_weight} kg</td>
        <td class="py-3 px-3 font-bold text-purple-700">${h.recycler_measured_weight ? `${h.recycler_measured_weight} kg` : 'Pending'}</td>
        <td class="py-3 px-3 font-bold text-emerald-700">₹${h.total_value.toFixed(2)}</td>
        <td class="py-3 px-3 text-right">${actionBlock}</td>
      `;
      tbody.appendChild(row);
      container.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error(err);
  }
}

async function verifyDelivery(deliveryId, manifestedWt, action) {
let activeHandoverForWeighbridge = null;

function openWeighbridgeModal(handoverId, declaredWeight, handoverCode) {
  activeHandoverForWeighbridge = { id: handoverId, declaredWeight, handoverCode };

  document.getElementById('wbHandoverCode').innerText = handoverCode;
  document.getElementById('wbDeclaredWeight').innerText = `${declaredWeight} kg`;
  document.getElementById('wbMeasuredInput').value = declaredWeight;
  document.getElementById('wbMismatchAlert').classList.add('hidden');

  openModal('weighbridgeModal');
}

async function submitWeighbridgeVerification(action = 'confirm') {
  if (!activeHandoverForWeighbridge) return;

  const measured = parseFloat(document.getElementById('wbMeasuredInput')?.value || 0);
  const notes = document.getElementById('wbNotesInput')?.value || '';

  try {
    const res = await fetch('/api/recycler/verify', {
    const res = await fetch(`/api/handovers/${activeHandoverForWeighbridge.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delivery_id: deliveryId,
        verified_weight: manifestedWt,
        action: action
        measured_weight: measured,
        action: action,
        notes: notes
      })
    });
    const result = await res.json();
    const data = await res.json();

    if (result.status === 'success') {
    closeModal('weighbridgeModal');

    if (data.status === 'success') {
      triggerConfetti();
      showToast(`🎉 Consignment Verified! Closed formal recycling loop. Awarded +${result.awarded_green_points} Green Points & ₹${result.awarded_cashback} Cashback!`, 'success');
      loadAdminData();
      fetchSessionAndData();
      showToast(data.message, 'success');
      loadRecyclerData();
    } else {
      showToast(result.message, 'warning');
      loadAdminData();
      showToast(data.message, 'warning');
      loadRecyclerData();
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// RECEIPT, RATING & UTILS
// SECONDARY GENERATOR MODULE (BUSINESSES)
// ==========================================

function openReceiptModal(txnCode) {
  const modal = document.getElementById('receiptModal');
  const codeEl = document.getElementById('receiptTxnCode');
  const dateEl = document.getElementById('receiptDate');
  const userEl = document.getElementById('receiptUser');
  const kabEl = document.getElementById('receiptKabadiwala');
  const totalEl = document.getElementById('receiptTotal');
async function loadGeneratorData() {
  try {
    const res = await fetch('/api/generators/requests');
    const data = await res.json();
    const container = document.getElementById('generatorRequestsList');
    if (!container) return;

  if (codeEl) codeEl.innerText = txnCode;
  if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (userEl && currentUser) userEl.innerText = `${currentUser.name} (${currentUser.user_code})`;
  if (kabEl && currentKabadiwala) kabEl.innerText = `${currentKabadiwala.name} (${currentKabadiwala.kabadiwala_code})`;
  if (totalEl) totalEl.innerText = `₹276.00`;
    container.innerHTML = '';
    const reqs = data.requests || [];

  if (modal) modal.classList.remove('hidden');
}
    reqs.forEach(r => {
      const card = document.createElement('div');
      card.className = "p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3";
      
      let actionBtn = '';
      if (r.status === 'pending') {
        actionBtn = `
          <button onclick="acceptGeneratorRequest(${r.id})" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
            Accept as Collector
          </button>
        `;
      } else {
        actionBtn = `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Assigned to Santosh Bhai</span>`;
      }

function printReceipt() {
  window.print();
      card.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs text-emerald-800">${r.request_code}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${r.generator_type}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 mt-1">${r.generator_name}</h4>
          <p class="text-xs text-slate-500 mt-0.5">📍 ${r.address} • Approx ${r.approx_weight} kg ${r.category_name}</p>
        </div>
        <div>${actionBtn}</div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}

function openRatingModal(pickupId) {
  const modal = document.getElementById('ratingModal');
  const input = document.getElementById('ratingPickupIdInput');
  if (input) input.value = pickupId;
  if (modal) modal.classList.remove('hidden');
async function acceptGeneratorRequest(reqId) {
  try {
    const res = await fetch(`/api/generators/requests/${reqId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collector_id: currentCollector.id })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pickup Accepted! Visit source location to create official digital Material Lot.', 'success');
      loadGeneratorData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitUserRating() {
  const pickupId = document.getElementById('ratingPickupIdInput')?.value;
  const stars = document.getElementById('ratingStarsSelect')?.value || 5;
  const review = document.getElementById('ratingReviewTextInput')?.value || '';
async function submitGeneratorRequest() {
  const name = document.getElementById('genSourceName')?.value;
  const type = document.getElementById('genSourceType')?.value;
  const phone = document.getElementById('genSourcePhone')?.value;
  const address = document.getElementById('genSourceAddress')?.value;
  const cat = document.getElementById('genSourceCat')?.value;
  const weight = parseFloat(document.getElementById('genSourceWeight')?.value || 10);

  try {
    const res = await fetch('/api/ratings', {
    const res = await fetch('/api/generators/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_id: pickupId,
        user_id: currentUser ? currentUser.id : 1,
        kabadiwala_id: currentKabadiwala ? currentKabadiwala.id : 1,
        stars: parseInt(stars),
        behaviour: 5,
        timeliness: 5,
        fair_weighing: 5,
        review_text: review
        generator_name: name,
        generator_type: type,
        phone: phone,
        address: address,
        category_code: cat,
        approx_weight: weight
      })
    });
    const result = await res.json();
    if (result.status === 'success') {
      closeModal('ratingModal');
      showToast(result.message, 'success');
      loadKabadiwalaData();
    const data = await res.json();
    if (data.status === 'success') {
      closeModal('generatorRequestModal');
      showToast(data.message, 'success');
      loadGeneratorData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function resetDemoData() {
  if (!confirm('Reset prototype demo database back to clean Smart India Hackathon presentation state?')) return;
// ==========================================
// ADMIN & ANOMALY DETECTION
// ==========================================

async function loadAdminData() {
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Database reset successfully with pre-seeded SIH records!', 'success');
      await fetchSessionAndData();
      if (activeRole === 'user') loadUserData();
      if (activeRole === 'kabadiwala') loadKabadiwalaData();
      if (activeRole === 'admin') loadAdminData();
    const ovRes = await fetch('/api/admin/overview');
    const ov = await ovRes.json();
    if (ov.status !== 'success') return;

    const m = ov.metrics;
    document.getElementById('admTotalCollectors').innerText = m.total_collectors;
    document.getElementById('admTotalRecyclers').innerText = m.authorized_recyclers;
    document.getElementById('admTotalVerifiedKg').innerText = `${m.total_verified_kg} kg`;
    document.getElementById('admTotalPayout').innerText = `₹${m.total_formal_payout_inr.toLocaleString('en-IN')}`;

    // Anomaly Logs
    const anomRes = await fetch('/api/anomalies');
    const anomData = await anomRes.json();
    const container = document.getElementById('adminAnomaliesList');
    if (!container) return;

    container.innerHTML = '';
    const logs = anomData.anomalies || [];

    if (logs.length === 0) {
      container.innerHTML = `<div class="p-4 text-xs text-slate-400 text-center">No anomalies detected. All transactions within nominal parameters.</div>`;
      return;
    }

    logs.forEach(log => {
      const card = document.createElement('div');
      card.className = "p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs";
      card.innerHTML = `
        <div class="p-1.5 rounded-lg bg-amber-200 text-amber-900 mt-0.5 shrink-0">
          <i data-lucide="alert-triangle" class="w-4 h-4"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-amber-950">${log.anomaly_type}</span>
            <span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900">${log.severity} SEVERITY</span>
          </div>
          <p class="text-amber-900/80 mt-1">${log.description}</p>
          <span class="text-[10px] text-amber-700/60 block mt-1">${log.flagged_at}</span>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error(err);
  }
}

function renderLiveRateTicker(categories) {
  const ticker = document.getElementById('liveRateTicker');
  if (!ticker) return;
  ticker.innerHTML = '';
// ==========================================
// UTILS & HELPERS
// ==========================================

  categories.forEach(c => {
    const badge = document.createElement('div');
    badge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold whitespace-nowrap shadow-sm";
    badge.innerHTML = `
      <span class="w-2 h-2 rounded-full" style="background-color: ${c.color || '#10b981'}"></span>
      <span>${c.name_en}:</span>
      <span class="text-emerald-700 font-bold">₹${c.user_rate_per_kg}/kg</span>
function renderCategoryChips() {
  const container = document.getElementById('eWasteCategoriesTicker');
  if (!container) return;

  container.innerHTML = '';
  allCategories.forEach(c => {
    const chip = document.createElement('div');
    chip.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold whitespace-nowrap shadow-sm border border-slate-200";
    chip.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.color}"></span>
      <span>${c.name_en}</span>
    `;
    ticker.appendChild(badge);
    container.appendChild(chip);
  });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'verified':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'arriving':
    case 'in_transit':
      return 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse';
    case 'accepted':
    case 'collected':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('hidden');
}

function getEcoLevelClass(level) {
  switch (level) {
    case 'Sustainability Hero': return 'badge-sustainability-hero';
    case 'Recycling Champion': return 'badge-recycling-champion';
    case 'Eco Collector': return 'badge-eco-collector';
    default: return 'badge-green-starter';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
  const m = document.getElementById(modalId);
  if (m) m.classList.add('hidden');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  let bgClass = "bg-slate-900 text-white";
  let iconName = "info";

  if (type === 'success') {
    bgClass = "bg-emerald-600 text-white";
    iconName = "check-circle-2";
  } else if (type === 'warning') {
    bgClass = "bg-amber-600 text-white";
    iconName = "alert-triangle";
  } else if (type === 'error') {
    bgClass = "bg-rose-600 text-white";
    iconName = "x-circle";
  }

  toast.className = `toast ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
    <div class="flex-1 text-xs sm:text-sm font-medium leading-snug">${message}</div>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

async function resetDemoData() {
  if (!confirm('Reset prototype demo database back to clean Smart India Hackathon presentation state?')) return;
  try {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Database reset successfully with fresh SIH e-waste demo records!', 'success');
      await fetchSessionAndCategories();
    }
  } catch (err) {
    console.error(err);
  }
}

function setupEventListeners() {
  // Modal click outside to close
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', (e) => {
      if (e.target === b) {
        b.parentElement.classList.add('hidden');
        b.classList.add('hidden');
      }
    });
  });
}

