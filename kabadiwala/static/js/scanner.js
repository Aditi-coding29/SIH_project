/**
 * scanner.js - AI Waste Scanner & Multi-Category Mixed Waste Cart
 * Prototype Machine Learning Heuristic Simulator with Visual Features
 * scanner.js - AI E-Waste Scanner (Computer Vision Classifier Simulator)
 * Focuses on PCBs, Cables, Batteries, Displays, Motors, and Electronic Devices
 */

const sampleScraps = [
const eWastePresets = [
  {
    key: 'plastic_bottles',
    label: '🧴 Plastic Bottles',
    subtitle: 'PET transparent bottles & caps',
    img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
    code: 'plastic',
    weight: 4.2
    key: 'pcb_motherboard',
    label: '🖥️ Motherboard PCB',
    subtitle: 'High-grade gold CPU sockets & RAM buses',
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60',
    cat: 'pcb',
    sub: 'pcb_motherboard',
    weight: 15.5
  },
  {
    key: 'cardboard_boxes',
    label: '📦 Cardboard Cartons',
    subtitle: 'Corrugated brown shipping boxes',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60',
    code: 'cardboard',
    weight: 6.5
    key: 'pcb_mixed',
    label: '🟩 Mixed Circuit Boards',
    subtitle: 'Consumer electronics ICs & power boards',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    cat: 'pcb',
    sub: 'pcb_mixed',
    weight: 22.8
  },
  {
    key: 'newspaper_raddi',
    label: '📰 Newspaper (Raddi)',
    subtitle: 'Tied broadsheet bundles & magazines',
    img: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=60',
    code: 'newspaper',
    weight: 8.0
    key: 'cables_heavy_copper',
    label: '🔌 Heavy Copper Cables',
    subtitle: 'Multi-strand heavy industrial power wires',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60',
    cat: 'cables',
    sub: 'cables_heavy_copper',
    weight: 18.5
  },
  {
    key: 'scrap_metal',
    label: '🥫 Scrap Metal / Cans',
    subtitle: 'Aluminum cans, iron rods, wires',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60',
    code: 'metal',
    weight: 3.5
    key: 'battery_li_ion',
    label: '🔋 Li-Ion Battery Packs',
    subtitle: 'Laptop & smartphone 18650 / pouch cells',
    img: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=60',
    cat: 'batteries',
    sub: 'battery_li_ion',
    weight: 12.0
  },
  {
    key: 'glass_bottles',
    label: '🍾 Glass Bottles',
    subtitle: 'Clear & amber beverage bottles',
    img: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=60',
    code: 'glass',
    weight: 5.0
    key: 'display_lcd_panel',
    label: '📺 LCD / LED Panels',
    subtitle: 'Flat display matrix with flex driver tape',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
    cat: 'displays',
    sub: 'display_lcd_panel',
    weight: 8.5
  },
  {
    key: 'electronic_ewaste',
    label: '💻 E-Waste / Electronics',
    subtitle: 'Circuit boards, power cords, phones',
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60',
    code: 'ewaste',
    weight: 2.5
    key: 'motors_copper_wound',
    label: '⚙️ Electric Motors',
    subtitle: 'Copper stator winding & magnetic rotor',
    img: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
    cat: 'motors',
    sub: 'motors_copper_wound',
    weight: 14.0
  },
  {
    key: 'devices_scrap_laptops',
    label: '💻 Scrap Laptops',
    subtitle: 'End-of-life depopulation-ready units',
    img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
    cat: 'devices',
    sub: 'devices_scrap_laptops',
    weight: 10.0
  }
];

let currentScanResult = null;
let mixedWasteCart = [];

function initScannerUI() {
  const sampleGrid = document.getElementById('samplePresetsGrid');
  if (!sampleGrid) return;
  const grid = document.getElementById('eWastePresetsGrid');
  if (!grid) return;

  sampleGrid.innerHTML = '';
  sampleScraps.forEach(s => {
  grid.innerHTML = '';
  eWastePresets.forEach(preset => {
    const card = document.createElement('div');
    card.className = "cursor-pointer group relative rounded-xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-white";
    card.className = "cursor-pointer group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-white";
    card.innerHTML = `
      <div class="h-24 w-full bg-slate-100 overflow-hidden relative">
        <img src="${s.img}" alt="${s.label}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <span class="absolute bottom-1.5 left-2 text-white font-medium text-xs drop-shadow">${s.label}</span>
      <div class="h-20 w-full bg-slate-900 overflow-hidden relative">
        <img src="${preset.img}" alt="${preset.label}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <span class="absolute bottom-1 left-2 text-white font-bold text-xs drop-shadow">${preset.label}</span>
      </div>
      <div class="p-2 text-center bg-slate-50">
        <button type="button" class="text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 flex items-center justify-center gap-1 w-full">
          <i data-lucide="scan" class="w-3.5 h-3.5"></i> Test AI Scan
        </button>
        <span class="text-[11px] font-semibold text-emerald-700 group-hover:text-emerald-800 flex items-center justify-center gap-1">
          <i data-lucide="scan" class="w-3 h-3"></i> AI Classify
        </span>
      </div>
    `;
    card.addEventListener('click', () => {
      runAIScan(s.key, s.img, s.label);
      runAIEWasteScan(preset.key, preset.img, preset.label);
    });
    sampleGrid.appendChild(card);
    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();

  // File upload listener
  const fileInput = document.getElementById('wasteImageUpload');
  const fileInput = document.getElementById('eWasteImageUpload');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          runAIScan('custom_upload', event.target.result, file.name);
          runAIEWasteScan('custom_upload', event.target.result, file.name);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Camera preview button
  const camBtn = document.getElementById('btnStartWebcam');
  if (camBtn) {
    camBtn.addEventListener('click', () => {
      startCameraSimulation();
    });
  }
}

function startCameraSimulation() {
async function runAIEWasteScan(sampleKey, imageSrc, label) {
  const preview = document.getElementById('scannerPreviewImg');
  const overlay = document.getElementById('scannerOverlay');
  const sample = sampleScraps[Math.floor(Math.random() * sampleScraps.length)];
  
  if (preview) {
    preview.src = sample.img;
    preview.classList.remove('hidden');
  }
  runAIScan(sample.key, sample.img, "Live Camera Capture");
}

async function runAIScan(sampleKey, imageSrc, label) {
  const preview = document.getElementById('scannerPreviewImg');
  const placeholder = document.getElementById('scannerPlaceholder');
  const overlay = document.getElementById('scannerScanningOverlay');
  const resultCard = document.getElementById('scannerResultCard');

  if (preview) {
    preview.src = imageSrc;
    preview.classList.remove('hidden');
  }
  if (placeholder) placeholder.classList.add('hidden');
  if (overlay) overlay.classList.remove('hidden');
  if (resultCard) resultCard.classList.add('hidden');

  try {
    const res = await fetch('/api/scanner/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sample_key: sampleKey, filename: label })
    });
    const data = await res.json();

    // Visual scanning delay for realistic AI inspection experience
    setTimeout(() => {
      if (overlay) overlay.classList.add('hidden');
      if (resultCard) resultCard.classList.remove('hidden');
      displayScanResult(data);
    }, 900);
      displayScanResult(data, imageSrc);
    }, 750);

  } catch (err) {
    console.error('Scan failed:', err);
    if (overlay) overlay.classList.add('hidden');
  }
}

function displayScanResult(data) {
function displayScanResult(data, imageSrc) {
  currentScanResult = data;
  currentScanResult.photo_url = imageSrc;

  const catName = document.getElementById('resCategoryName');
  const confText = document.getElementById('resConfidence');
  const confBar = document.getElementById('resConfidenceBar');
  const rateText = document.getElementById('resRatePerKg');
  const weightInput = document.getElementById('resEstWeightInput');
  const estVal = document.getElementById('resEstimatedValue');
  const featuresBox = document.getElementById('resFeaturesDetected');
  const impactBadge = document.getElementById('resImpactBadge');
  const subName = document.getElementById('scanResSubName');
  const confText = document.getElementById('scanResConfidence');
  const confBar = document.getElementById('scanResConfidenceBar');
  const condBadge = document.getElementById('scanResConditionBadge');
  const rangeText = document.getElementById('scanResPriceRange');
  const featuresBox = document.getElementById('scanResFeatures');
  const weightInput = document.getElementById('lotWeightInput');
  const categorySelect = document.getElementById('lotCategorySelect');
  const subcategorySelect = document.getElementById('lotSubcategorySelect');

  if (catName) catName.innerText = data[`category_name_${currentLang}`] || data.category_name_en;
  if (subName) subName.innerText = data.subcategory_name;
  if (confText) confText.innerText = `${data.confidence}%`;
  if (confBar) confBar.style.width = `${data.confidence}%`;
  if (rateText) rateText.innerText = `₹${data.rate_per_kg} / kg`;
  if (weightInput) {
    weightInput.value = data.estimated_weight_kg;
    weightInput.oninput = () => {
      const w = parseFloat(weightInput.value) || 0;
      currentScanResult.estimated_weight_kg = w;
      if (estVal) estVal.innerText = `₹${(w * data.rate_per_kg).toFixed(2)}`;
    };
  }
  if (estVal) estVal.innerText = `₹${data.estimated_value_inr}`;
  if (condBadge) condBadge.innerText = data.condition;
  if (rangeText) rangeText.innerText = data.indicative_price_range;

  if (featuresBox) {
    featuresBox.innerHTML = '';
    (data.features_detected || []).forEach(f => {
      const badge = document.createElement('span');
      badge.className = "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium";
      badge.className = "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold";
      badge.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3 mr-1 text-emerald-600"></i> ${f}`;
      featuresBox.appendChild(badge);
    });
  }

  if (impactBadge) {
    impactBadge.innerText = `+${data.impact_score_per_kg} Green Points / kg`;
  // Pre-populate Lot creation form
  if (weightInput) weightInput.value = data.estimated_weight;
  if (categorySelect) {
    categorySelect.value = data.category_code;
    populateSubcategoriesDropdown(data.category_code, data.subcategory_code);
  }

  if (window.lucide) lucide.createIcons();
}

function addToMixedCart() {
  if (!currentScanResult) return;

  const existing = mixedWasteCart.find(i => i.category_code === currentScanResult.category_code);
  if (existing) {
    existing.estimated_weight += currentScanResult.estimated_weight_kg;
    existing.estimated_value = Math.round(existing.estimated_weight * existing.rate_per_kg * 100) / 100;
  } else {
    mixedWasteCart.push({
      category_code: currentScanResult.category_code,
      name: currentScanResult[`category_name_${currentLang}`] || currentScanResult.category_name_en,
      estimated_weight: currentScanResult.estimated_weight_kg,
      rate_per_kg: currentScanResult.rate_per_kg,
      estimated_value: currentScanResult.estimated_value_inr,
      color: currentScanResult.color,
      icon: currentScanResult.icon
    });
  }

  renderMixedWasteCart();

  // Highlight cart
  const cartSection = document.getElementById('mixedWasteSection');
  if (cartSection) {
    cartSection.classList.remove('hidden');
    cartSection.scrollIntoView({ behavior: 'smooth' });
  }

  showToast(`Added ${currentScanResult.category_name_en} (${currentScanResult.estimated_weight_kg} kg) to Mixed Waste Cart!`, 'success');
}

function removeFromMixedCart(index) {
  mixedWasteCart.splice(index, 1);
  renderMixedWasteCart();
}

function renderMixedWasteCart() {
  const container = document.getElementById('mixedCartItemsList');
  const emptyNote = document.getElementById('mixedCartEmptyNote');
  const totalWeightEl = document.getElementById('mixedCartTotalWeight');
  const totalValueEl = document.getElementById('mixedCartTotalValue');
  const submitBtn = document.getElementById('btnSubmitPickup');

  if (!container) return;

  if (mixedWasteCart.length === 0) {
    container.innerHTML = '';
    if (emptyNote) emptyNote.classList.remove('hidden');
    if (totalWeightEl) totalWeightEl.innerText = '0 kg';
    if (totalValueEl) totalValueEl.innerText = '₹0';
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  if (emptyNote) emptyNote.classList.add('hidden');
  if (submitBtn) submitBtn.disabled = false;

  container.innerHTML = '';
  let totalWt = 0;
  let totalVal = 0;

  mixedWasteCart.forEach((item, idx) => {
    totalWt += item.estimated_weight;
    const subtotal = Math.round(item.estimated_weight * item.rate_per_kg * 100) / 100;
    totalVal += subtotal;

    const row = document.createElement('div');
    row.className = "flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-sm";
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style="background-color: ${item.color || '#10b981'}">
          ${item.category_code.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h5 class="font-semibold text-sm text-slate-800">${item.name}</h5>
          <p class="text-xs text-slate-500">${item.estimated_weight} kg × ₹${item.rate_per_kg}/kg</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-emerald-700 text-sm">₹${subtotal.toFixed(2)}</span>
        <button type="button" onclick="removeFromMixedCart(${idx})" class="text-slate-400 hover:text-red-500 transition-colors p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  if (totalWeightEl) totalWeightEl.innerText = `${totalWt.toFixed(1)} kg`;
  if (totalValueEl) totalValueEl.innerText = `₹${totalVal.toFixed(2)}`;

  if (window.lucide) lucide.createIcons();
}

async function submitPickupRequest() {
  if (mixedWasteCart.length === 0) {
    showToast('Please scan and add at least one waste item.', 'warning');
    return;
  }

  const address = document.getElementById('pickupAddressInput')?.value || 'Flat 402, Green Meadows, Sector 21, New Delhi';
  const preferredTime = document.getElementById('pickupPreferredTimeSelect')?.value || 'Morning (10 AM - 1 PM)';
  const notes = document.getElementById('pickupNotesInput')?.value || '';

  const payload = {
    user_id: window.currentUser ? window.currentUser.id : 1,
    pickup_address: address,
    preferred_time: preferredTime,
    notes: notes,
    items: mixedWasteCart.map(i => ({
      category_code: i.category_code,
      estimated_weight: i.estimated_weight
    }))
  };

  try {
    const res = await fetch('/api/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === 'success') {
      // Clear cart
      mixedWasteCart = [];
      renderMixedWasteCart();

      // Close modal
      closeModal('scannerModal');

      // Refresh user view
      showToast(`🎉 Pickup Request ${result.pickup_code} Created Successfully! Nearby Kabadiwala has been notified.`, 'success');
      
      if (typeof loadUserData === 'function') loadUserData();
      if (typeof loadKabadiwalaData === 'function') loadKabadiwalaData();
      
      // Auto open tracking modal for immediate visual excitement
      if (result.pickup_id) {
        setTimeout(() => {
          openTrackingModal(result.pickup_id);
        }, 1200);
      }
    } else {
      showToast(result.message || 'Failed to submit pickup request', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error while requesting pickup.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initScannerUI();
});

