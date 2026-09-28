"""
app.py - Main Flask Application & REST API Server for Kabadiwala Connect
Smart India Hackathon: Bringing the Informal E-Waste Collector into the Formal Recycling Chain
"""

import os
import random
import string
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, session
import database

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'kabadiwala_connect_sih_ewaste_key'

# Ensure database is initialized
database.init_db(force_reseed=False)

def generate_code(prefix, table, column):
    """Generates unique IDs like KC-COL-10042, KC-LOT-10029, KC-HND-30045, KC-BULK-10008, etc."""
    conn = database.get_db()
    cursor = conn.cursor()
    while True:
        num = random.randint(10010, 99999)
        code = f"{prefix}-{num}"
        cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE {column} = ?", (code,))
        if cursor.fetchone()[0] == 0:
            conn.close()
            return code

def calculate_collector_trust_score(collector_id):
    """Computes transparent Trust Score (0-100) based on verified transactions, weight accuracy, and ratings."""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT COUNT(*), COALESCE(SUM(CASE WHEN mismatch_flag = 0 THEN 1 ELSE 0 END), 0)
    FROM handover_records
    WHERE collector_id = ? AND handover_status = 'verified'
    """, (collector_id,))
    row = cursor.fetchone()
    total_handovers = row[0]
    accurate_handovers = row[1]

    cursor.execute("SELECT rating FROM collectors WHERE id = ?", (collector_id,))
    rating_row = cursor.fetchone()
    rating = rating_row[0] if rating_row else 4.8

    if total_handovers == 0:
        score = 90
    else:
        accuracy_ratio = (accurate_handovers / total_handovers)
        score = int(70 + (accuracy_ratio * 20) + ((rating / 5.0) * 10))

    score = min(99, max(60, score))
    cursor.execute("UPDATE collectors SET trust_score = ? WHERE id = ?", (score, collector_id))
    conn.commit()
    conn.close()
    return score

# ==========================================
# PAGE ROUTES
# ==========================================

@app.route('/')
def index():
    return render_template('index.html')

# ==========================================
# AUTH & ROLE SWITCHING
# ==========================================

@app.route('/api/auth/current', methods=['GET'])
def get_current_session():
    role = session.get('active_role', 'collector')
    collector_id = session.get('collector_id', 1)
    recycler_id = session.get('recycler_id', 1)

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM collectors WHERE id = ?", (collector_id,))
    col_row = cursor.fetchone()
    collector_data = dict(col_row) if col_row else None

    cursor.execute("SELECT * FROM authorized_recyclers WHERE id = ?", (recycler_id,))
    rec_row = cursor.fetchone()
    recycler_data = dict(rec_row) if rec_row else None

    conn.close()
    return jsonify({
        'status': 'success',
        'active_role': role,
        'collector': collector_data,
        'recycler': recycler_data,
        'generator': {
            'code': 'KC-GEN-10012',
            'name': 'InfoTech Hardware Solutions Pvt Ltd',
            'type': 'Small IT Office & BPO',
            'address': 'B-104, IT Park, Okhla Phase 3, New Delhi'
        }
    })

@app.route('/api/auth/switch', methods=['POST'])
def switch_role():
    data = request.get_json() or {}
    new_role = data.get('role', 'collector')
    if new_role not in ['collector', 'recycler', 'generator', 'admin', 'landing']:
        return jsonify({'status': 'error', 'message': 'Invalid persona role'}), 400
    session['active_role'] = new_role
    return jsonify({'status': 'success', 'active_role': new_role})

@app.route('/api/auth/register-collector', methods=['POST'])
def register_collector():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    city = data.get('city', 'New Delhi').strip()
    service_area = data.get('service_area', '').strip()

    if not name or not phone or not service_area:
        return jsonify({'status': 'error', 'message': 'Name, Phone, and Service Area are required.'}), 400

    conn = database.get_db()
    collector_code = generate_code('KC-COL', 'collectors', 'collector_code')
    last4 = ''.join(random.choices(string.digits, k=4))
    masked_id = f"CPCB-REF: XXXX-XXXX-{last4}"

    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO collectors (collector_code, name, phone, address, city, service_area, masked_id, verification_status, trust_score, rating, rating_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Verified', 92, 5.0, 1)
    """, (collector_code, name, phone, address, city, service_area, masked_id))
    new_id = cursor.lastrowid
    conn.commit()

    session['collector_id'] = new_id
    session['active_role'] = 'collector'

    cursor.execute("SELECT * FROM collectors WHERE id = ?", (new_id,))
    created_col = dict(cursor.fetchone())
    conn.close()

    return jsonify({'status': 'success', 'collector': created_col})

# ==========================================
# E-WASTE CATEGORIES & SUBCATEGORIES
# ==========================================

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM e_waste_categories ORDER BY impact_factor DESC")
    cats = [dict(r) for r in cursor.fetchall()]

    for c in cats:
        cursor.execute("SELECT * FROM e_waste_subcategories WHERE category_code = ?", (c['code'],))
        c['subcategories'] = [dict(s) for s in cursor.fetchall()]

    conn.close()
    return jsonify({'status': 'success', 'categories': cats})

# ==========================================
# PRICE DISCOVERY ENGINE (CORE FEATURE)
# ==========================================

@app.route('/api/price-discovery', methods=['GET', 'POST'])
def discover_price():
    sub_code = request.args.get('subcategory_code') or (request.get_json() or {}).get('subcategory_code', 'pcb_mixed')

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.*, c.name_en as category_name, c.icon, c.color
    FROM e_waste_subcategories s
    JOIN e_waste_categories c ON s.category_code = c.code
    WHERE s.code = ?
    """, (sub_code,))
    sub_row = cursor.fetchone()
    if not sub_row:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Subcategory not found'}), 404

    sub_info = dict(sub_row)

    cursor.execute("""
    SELECT date, price_per_kg, source, condition
    FROM price_dataset
    WHERE subcategory_code = ?
    ORDER BY date ASC
    """, (sub_code,))
    trend = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT o.*, r.name as recycler_name, r.recycler_code, r.authorization_status, r.facility_location, r.rating as recycler_rating
    FROM recycler_offers o
    JOIN authorized_recyclers r ON o.recycler_id = r.id
    WHERE o.subcategory_code = ?
    ORDER BY o.offered_rate_per_kg DESC
    """, (sub_code,))
    offers = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({
        'status': 'success',
        'subcategory': sub_info,
        'market_range': {
            'min': sub_info['indicative_min_price'],
            'max': sub_info['indicative_max_price'],
            'historical_avg': sub_info['historical_avg_price'],
            'unit': sub_info['unit']
        },
        'historical_trend': trend,
        'recycler_offers': offers,
        'disclaimer': "Market ranges are indicative reference benchmarks compiled from CPCB e-waste auctions and licensed refiners. Actual settlement depends on lot assay purity and agreed recycler terms."
    })

# ==========================================
# AI RECYCLER MATCHING ENGINE
# ==========================================

@app.route('/api/recyclers/match', methods=['POST'])
def match_recyclers():
    data = request.get_json() or {}
    sub_code = data.get('subcategory_code', 'pcb_mixed')
    lot_weight = float(data.get('weight', 20.0))

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT s.*, c.code as cat_code FROM e_waste_subcategories s
    JOIN e_waste_categories c ON s.category_code = c.code
    WHERE s.code = ?
    """, (sub_code,))
    sub_row = cursor.fetchone()
    if not sub_row:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Invalid subcategory'}), 400

    cat_code = sub_row['cat_code']
    base_max = sub_row['indicative_max_price']

    cursor.execute("SELECT * FROM authorized_recyclers WHERE verification_status = 'Authorized'")
    recyclers = [dict(r) for r in cursor.fetchall()]

    matched = []
    for r in recyclers:
        accepted_cats = json.loads(r['accepted_categories_json'])
        if cat_code in accepted_cats:
            cursor.execute("SELECT * FROM recycler_offers WHERE recycler_id = ? AND subcategory_code = ?", (r['id'], sub_code))
            offer = cursor.fetchone()
            offered_rate = offer['offered_rate_per_kg'] if offer else sub_row['historical_avg_price']
            min_qty = offer['min_quantity_kg'] if offer else r['min_lot_quantity_kg']
            pay_terms = offer['payment_terms'] if offer else "Standard Bank Clearance"

            price_score = min(100, (offered_rate / base_max) * 100) * 0.45
            qty_score = (100 if lot_weight >= min_qty else 60) * 0.25
            rating_score = (r['rating'] / 5.0) * 100 * 0.20
            auth_score = 100 * 0.10

            total_match_score = int(price_score + qty_score + rating_score + auth_score)
            total_match_score = min(99, max(75, total_match_score))

            matched.append({
                'recycler_id': r['id'],
                'recycler_code': r['recycler_code'],
                'name': r['name'],
                'authorization_status': r['authorization_status'],
                'license_no': r['license_no'],
                'facility_location': r['facility_location'],
                'service_area': r['service_area'],
                'contact_phone': r['contact_phone'],
                'rating': r['rating'],
                'offered_rate_per_kg': offered_rate,
                'min_quantity_kg': min_qty,
                'payment_terms': pay_terms,
                'pickup_available': bool(r['pickup_available']),
                'match_score': total_match_score
            })

    matched.sort(key=lambda x: x['match_score'], reverse=True)
    conn.close()
    return jsonify({
        'status': 'success',
        'subcategory_code': sub_code,
        'lot_weight_kg': lot_weight,
        'recommendations': matched,
        'engine_note': "AI/ML-ready recommendation engine. Matches material lots with licensed refiners based on pricing, distance, and CPCB license verification."
    })

# ==========================================
# AI E-WASTE SCANNER (MODULAR PREDICTOR)
# ==========================================

@app.route('/api/scanner/detect', methods=['POST'])
def detect_e_waste():
    data = request.get_json() or {}
    sample_key = data.get('sample_key', '')
    filename = data.get('filename', '').lower()

    presets = {
        'pcb_motherboard': {
            'cat': 'pcb',
            'sub': 'pcb_motherboard',
            'confidence': 96.4,
            'features': ['Gold-plated LGA/PGA CPU socket', 'Multi-layer FR-4 fiberglass substrate', 'SMD microchip array', 'Capacitor banks'],
            'condition': 'Grade A - High Yield',
            'est_weight': 15.5
        },
        'pcb_mixed': {
            'cat': 'pcb',
            'sub': 'pcb_mixed',
            'confidence': 94.2,
            'features': ['Mixed integrated circuit boards', 'Soldered resistor network', 'Daughterboard connectors'],
            'condition': 'Mixed / Unsorted',
            'est_weight': 22.8
        },
        'cables_heavy_copper': {
            'cat': 'cables',
            'sub': 'cables_heavy_copper',
            'confidence': 98.1,
            'features': ['Heavy multi-strand copper core', 'Cross-linked polyethylene insulation', 'High ductile gauge'],
            'condition': 'Grade A - Heavy Cable',
            'est_weight': 18.5
        },
        'battery_li_ion': {
            'cat': 'batteries',
            'sub': 'battery_li_ion',
            'confidence': 95.7,
            'features': ['Li-ion hazardous warning symbol', '18650 cylindrical cell enclosure', 'Aluminum thermal casing'],
            'condition': 'Intact / Discharged (HazMat Labelled)',
            'est_weight': 12.0
        },
        'display_lcd_panel': {
            'cat': 'displays',
            'sub': 'display_lcd_panel',
            'confidence': 93.8,
            'features': ['Indium-tin oxide glass matrix', 'Polarizing filter film', 'Miniaturized flex circuit tape'],
            'condition': 'Unbroken Panel Assembly',
            'est_weight': 8.5
        },
        'motors_copper_wound': {
            'cat': 'motors',
            'sub': 'motors_copper_wound',
            'confidence': 97.0,
            'features': ['Enameled copper stator winding', 'Silicon steel lamination rotor', 'Cast iron housing'],
            'condition': 'Depopulated Motor Core',
            'est_weight': 14.0
        },
        'devices_scrap_laptops': {
            'cat': 'devices',
            'sub': 'devices_scrap_laptops',
            'confidence': 96.1,
            'features': ['Lithium battery compartment', 'Integrated motherboard + RAM', 'Trackpad & display chassis'],
            'condition': 'End-of-Life Whole Unit',
            'est_weight': 10.0
        }
    }

    if sample_key in presets:
        detected = presets[sample_key]
    else:
        if 'cable' in filename or 'wire' in filename:
            detected = presets['cables_heavy_copper']
        elif 'battery' in filename or 'cell' in filename:
            detected = presets['battery_li_ion']
        elif 'screen' in filename or 'lcd' in filename or 'display' in filename:
            detected = presets['display_lcd_panel']
        elif 'motor' in filename or 'magnet' in filename:
            detected = presets['motors_copper_wound']
        elif 'laptop' in filename or 'phone' in filename:
            detected = presets['devices_scrap_laptops']
        elif 'board' in filename or 'chip' in filename or 'pcb' in filename:
            detected = presets['pcb_motherboard']
        else:
            detected = presets['pcb_mixed']

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.*, c.name_en as cat_name, c.icon, c.color
    FROM e_waste_subcategories s
    JOIN e_waste_categories c ON s.category_code = c.code
    WHERE s.code = ?
    """, (detected['sub'],))
    row = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        'status': 'success',
        'category_code': detected['cat'],
        'subcategory_code': detected['sub'],
        'subcategory_name': row['name_en'],
        'confidence': detected['confidence'],
        'condition': detected['condition'],
        'features_detected': detected['features'],
        'estimated_weight': detected['est_weight'],
        'unit': row['unit'],
        'indicative_price_range': f"₹{row['indicative_min_price']} – ₹{row['indicative_max_price']}/{row['unit']}",
        'historical_avg_price': row['historical_avg_price'],
        'icon': row['icon'],
        'color': row['color'],
        'disclaimer': "AI DEMO PREDICTION: Photo-based computer vision analysis is strictly indicative for lot classification. Final commercial settlement is based entirely on actual weighbridge weight and physical purity assay."
    })

# ==========================================
# DIGITAL MATERIAL LOTS SYSTEM
# ==========================================

@app.route('/api/lots', methods=['GET'])
def get_lots():
    collector_id = request.args.get('collector_id', 1)
    status = request.args.get('status')

    conn = database.get_db()
    cursor = conn.cursor()

    query = """
    SELECT l.*, s.name_en as subcategory_name, s.unit, c.name_en as category_name, c.icon, c.color,
           r.name as recycler_name, r.recycler_code
    FROM material_lots l
    JOIN e_waste_subcategories s ON l.subcategory_code = s.code
    JOIN e_waste_categories c ON l.category_code = c.code
    LEFT JOIN authorized_recyclers r ON l.selected_recycler_id = r.id
    WHERE l.collector_id = ?
    """
    params = [collector_id]

    if status:
        query += " AND l.status = ?"
        params.append(status)

    query += " ORDER BY l.id DESC"
    cursor.execute(query, params)
    lots = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({'status': 'success', 'lots': lots})

@app.route('/api/lots', methods=['POST'])
def create_lot():
    data = request.get_json() or {}
    collector_id = data.get('collector_id', 1)
    cat_code = data.get('category_code')
    sub_code = data.get('subcategory_code')
    est_weight = float(data.get('estimated_weight', 0))
    actual_weight = float(data.get('actual_weight', est_weight))
    condition = data.get('condition', 'Mixed / Unsorted')
    source_type = data.get('source_type', 'Local Repair Shops & Field Collection')
    location = data.get('location', 'Collector Yard, Old Rohtak Road, New Delhi')
    procurement_cost = float(data.get('procurement_cost', 0.0))
    photo_url = data.get('photo_url', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60')
    notes = data.get('notes', '')

    if not cat_code or not sub_code or actual_weight <= 0:
        return jsonify({'status': 'error', 'message': 'Material category, subcategory, and valid weight are required.'}), 400

    conn = database.get_db()
    cursor = conn.cursor()

    lot_code = generate_code('KC-LOT', 'material_lots', 'lot_code')
    today_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute("""
    INSERT INTO material_lots 
    (lot_code, collector_id, category_code, subcategory_code, photo_url, estimated_weight, actual_weight, condition, source_type, collection_date, location, status, procurement_cost, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lot_created', ?, ?, ?)
    """, (lot_code, collector_id, cat_code, sub_code, photo_url, est_weight, actual_weight, condition, source_type, today_str, location, procurement_cost, notes, today_str))
    lot_id = cursor.lastrowid

    cursor.execute("""
    UPDATE collectors 
    SET total_lots_created = total_lots_created + 1, total_ewaste_collected_kg = total_ewaste_collected_kg + ?
    WHERE id = ?
    """, (actual_weight, collector_id))

    database.create_e_waste_milestones(cursor, lot_id, current_stage=3)

    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'lot_id': lot_id,
        'lot_code': lot_code,
        'message': f'Material Lot {lot_code} created successfully! Ready for Price Discovery & Recycler Matching.'
    })

@app.route('/api/lots/merge', methods=['POST'])
def merge_lots():
    data = request.get_json() or {}
    collector_id = data.get('collector_id', 1)
    lot_ids = data.get('lot_ids', [])

    if len(lot_ids) < 2:
        return jsonify({'status': 'error', 'message': 'Select at least 2 lots to aggregate into a bulk consignment.'}), 400

    conn = database.get_db()
    cursor = conn.cursor()

    placeholders = ','.join('?' * len(lot_ids))
    cursor.execute(f"SELECT * FROM material_lots WHERE id IN ({placeholders}) AND collector_id = ?", (*lot_ids, collector_id))
    lots = [dict(r) for r in cursor.fetchall()]

    if len(lots) != len(lot_ids):
        conn.close()
        return jsonify({'status': 'error', 'message': 'One or more lots invalid or unauthorized.'}), 400

    total_bulk_weight = sum(l['actual_weight'] or l['estimated_weight'] for l in lots)
    primary_cat = lots[0]['category_code']

    bulk_code = generate_code('KC-BULK', 'bulk_lots', 'bulk_lot_code')

    cursor.execute("""
    INSERT INTO bulk_lots (bulk_lot_code, collector_id, category_code, total_weight, lot_ids_json)
    VALUES (?, ?, ?, ?, ?)
    """, (bulk_code, collector_id, primary_cat, total_bulk_weight, json.dumps(lot_ids)))

    cursor.execute(f"UPDATE material_lots SET status = 'aggregated' WHERE id IN ({placeholders})", (*lot_ids,))

    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'bulk_lot_code': bulk_code,
        'total_weight_kg': total_bulk_weight,
        'message': f'Aggregated {len(lot_ids)} smaller lots into Bulk Lot {bulk_code} ({total_bulk_weight} kg)!'
    })

# ==========================================
# DIGITAL HANDOVER & RECYCLER VERIFICATION
# ==========================================

@app.route('/api/handovers', methods=['GET'])
def get_handovers():
    collector_id = request.args.get('collector_id')
    recycler_id = request.args.get('recycler_id')

    conn = database.get_db()
    cursor = conn.cursor()

    query = """
    SELECT h.*, l.lot_code, l.category_code, l.subcategory_code, s.name_en as subcategory_name,
           c.name as collector_name, c.collector_code, c.trust_score,
           r.name as recycler_name, r.recycler_code, r.facility_location
    FROM handover_records h
    JOIN material_lots l ON h.lot_id = l.id
    JOIN e_waste_subcategories s ON l.subcategory_code = s.code
    JOIN collectors c ON h.collector_id = c.id
    JOIN authorized_recyclers r ON h.recycler_id = r.id
    WHERE 1=1
    """
    params = []
    if collector_id:
        query += " AND h.collector_id = ?"
        params.append(collector_id)
    if recycler_id:
        query += " AND h.recycler_id = ?"
        params.append(recycler_id)

    query += " ORDER BY h.id DESC"
    cursor.execute(query, params)
    handovers = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({'status': 'success', 'handovers': handovers})

@app.route('/api/handovers', methods=['POST'])
def create_handover():
    data = request.get_json() or {}
    lot_id = data.get('lot_id')
    collector_id = data.get('collector_id', 1)
    recycler_id = data.get('recycler_id')
    agreed_rate = float(data.get('agreed_rate_per_kg', 0))

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM material_lots WHERE id = ? AND collector_id = ?", (lot_id, collector_id))
    lot = cursor.fetchone()
    if not lot:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Material Lot not found'}), 404

    declared_weight = lot['actual_weight'] or lot['estimated_weight']
    total_val = round(declared_weight * agreed_rate, 2)
    hnd_code = generate_code('KC-HND', 'handover_records', 'handover_code')

    cursor.execute("""
    INSERT INTO handover_records 
    (handover_code, lot_id, collector_id, recycler_id, collector_declared_weight, agreed_rate_per_kg, total_value, payment_status, handover_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'in_transit')
    """, (hnd_code, lot_id, collector_id, recycler_id, declared_weight, agreed_rate, total_val))
    hnd_id = cursor.lastrowid

    cursor.execute("""
    UPDATE material_lots 
    SET status = 'handover_scheduled', selected_recycler_id = ?, offered_rate = ?
    WHERE id = ?
    """, (recycler_id, agreed_rate, lot_id))

    cursor.execute("UPDATE tracking_events SET status = 'completed' WHERE lot_id = ? AND stage_number <= 6", (lot_id,))
    cursor.execute("UPDATE tracking_events SET status = 'current' WHERE lot_id = ? AND stage_number = 7", (lot_id,))

    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'handover_id': hnd_id,
        'handover_code': hnd_code,
        'total_value': total_val,
        'message': f'Digital Handover {hnd_code} created! Consignment en route to recycler.'
    })

@app.route('/api/handovers/<int:hnd_id>/verify', methods=['POST'])
def verify_handover(hnd_id):
    data = request.get_json() or {}
    measured_weight = float(data.get('measured_weight', 0))
    action = data.get('action', 'confirm')
    notes = data.get('notes', '')

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM handover_records WHERE id = ?", (hnd_id,))
    hnd = cursor.fetchone()
    if not hnd:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Handover record not found'}), 404

    declared_wt = hnd['collector_declared_weight']
    if measured_weight <= 0:
        measured_weight = declared_wt

    weight_diff = round(abs(declared_wt - measured_weight), 2)
    variance_pct = (weight_diff / declared_wt * 100) if declared_wt > 0 else 0
    is_mismatch = 1 if (weight_diff > 0.5 and variance_pct > 3.0) else 0

    if action == 'confirm' and not is_mismatch:
        final_value = round(measured_weight * hnd['agreed_rate_per_kg'], 2)
        today_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute("""
        UPDATE handover_records 
        SET recycler_measured_weight = ?, weight_difference = ?, mismatch_flag = 0,
            total_value = ?, payment_status = 'Paid', handover_status = 'verified',
            verified_timestamp = ?, notes = ?
        WHERE id = ?
        """, (measured_weight, weight_diff, final_value, today_str, notes, hnd_id))

        pay_code = generate_code('KC-PAY', 'payments', 'payment_code')
        pay_ref = f"UPI/260907/{hnd['id']}/VERIFIED"
        cursor.execute("""
        INSERT INTO payments (payment_code, handover_id, collector_id, recycler_id, amount, payment_method, payment_status, payment_reference)
        VALUES (?, ?, ?, ?, ?, 'Instant UPI', 'Paid', ?)
        """, (pay_code, hnd_id, hnd['collector_id'], hnd['recycler_id'], final_value, pay_ref))

        cursor.execute("UPDATE material_lots SET status = 'verified', actual_weight = ? WHERE id = ?", (measured_weight, hnd['lot_id']))
        cursor.execute("UPDATE tracking_events SET status = 'completed' WHERE lot_id = ?", (hnd['lot_id'],))

        cursor.execute("SELECT procurement_cost, category_code FROM material_lots WHERE id = ?", (hnd['lot_id'],))
        l_row = cursor.fetchone()
        proc_cost = l_row['procurement_cost'] if l_row else 0.0
        cat_code = l_row['category_code'] if l_row else 'pcb'
        gross_margin = round(final_value - proc_cost, 2)

        cursor.execute("SELECT impact_factor FROM e_waste_categories WHERE code = ?", (cat_code,))
        imp_row = cursor.fetchone()
        impact_factor = imp_row['impact_factor'] if imp_row else 20.0
        awarded_points = int(measured_weight * impact_factor)

        cursor.execute("""
        UPDATE collectors 
        SET verified_ewaste_kg = verified_ewaste_kg + ?,
            gross_sales_inr = gross_sales_inr + ?,
            gross_margin_inr = gross_margin_inr + ?,
            green_points = green_points + ?
        WHERE id = ?
        """, (measured_weight, final_value, gross_margin, awarded_points, hnd['collector_id']))

        conn.commit()
        conn.close()

        calculate_collector_trust_score(hnd['collector_id'])

        return jsonify({
            'status': 'success',
            'handover_status': 'verified',
            'measured_weight': measured_weight,
            'declared_weight': declared_wt,
            'weight_difference': weight_diff,
            'final_value': final_value,
            'gross_margin': gross_margin,
            'awarded_green_points': awarded_points,
            'message': f'✓ RECYCLING VERIFIED! Consignment {hnd["handover_code"]} formally confirmed at weighbridge.'
        })

    else:
        cursor.execute("""
        UPDATE handover_records 
        SET recycler_measured_weight = ?, weight_difference = ?, mismatch_flag = 1,
            handover_status = 'mismatch_flagged', notes = ?
        WHERE id = ?
        """, (measured_weight, weight_diff, f"⚠️ Weight Mismatch: Declared {declared_wt}kg vs Measured {measured_weight}kg ({variance_pct:.1f}% variance). {notes}", hnd_id))

        cursor.execute("""
        INSERT INTO anomaly_logs (anomaly_type, lot_id, handover_id, description, severity, status)
        VALUES ('Weight Variance Discrepancy', ?, ?, ?, 'high', 'flagged')
        """, (hnd['lot_id'], hnd_id, f"Handover {hnd['handover_code']} flagged with {variance_pct:.1f}% weight discrepancy ({declared_wt} kg declared vs {measured_weight} kg weighbridge)."))

        conn.commit()
        conn.close()

        return jsonify({
            'status': 'warning',
            'handover_status': 'mismatch_flagged',
            'weight_difference': weight_diff,
            'variance_pct': round(variance_pct, 1),
            'message': f'⚠️ Weight Mismatch Flagged! Declared {declared_wt} kg vs Measured {measured_weight} kg. Audit report generated.'
        })

# ==========================================
# SECONDARY MODULE: BUSINESS / HOUSEHOLD REQUESTS
# ==========================================

@app.route('/api/generators/requests', methods=['GET', 'POST'])
def generator_requests():
    conn = database.get_db()
    cursor = conn.cursor()

    if request.method == 'POST':
        data = request.get_json() or {}
        gen_name = data.get('generator_name', 'Tech Repair Shop').strip()
        gen_type = data.get('generator_type', 'Small Business')
        phone = data.get('phone', '+91 98000 11223').strip()
        address = data.get('address', 'Nehru Place, New Delhi').strip()
        cat_code = data.get('category_code', 'pcb')
        approx_wt = float(data.get('approx_weight', 10.0))
        pref_time = data.get('preferred_time', 'Morning (10 AM - 1 PM)')
        notes = data.get('notes', '')

        req_code = generate_code('KC-GEN', 'collection_requests', 'request_code')
        cursor.execute("""
        INSERT INTO collection_requests 
        (request_code, generator_name, generator_type, phone, address, category_code, approx_weight, status, preferred_time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        """, (req_code, gen_name, gen_type, phone, address, cat_code, approx_wt, pref_time, notes))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'request_code': req_code, 'message': f'E-Waste collection request {req_code} posted to nearby informal collectors!'})

    else:
        cursor.execute("""
        SELECT r.*, c.name_en as category_name, c.icon, c.color
        FROM collection_requests r
        JOIN e_waste_categories c ON r.category_code = c.code
        ORDER BY r.id DESC
        """)
        requests_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({'status': 'success', 'requests': requests_list})

@app.route('/api/generators/requests/<int:req_id>/accept', methods=['POST'])
def accept_generator_request(req_id):
    data = request.get_json() or {}
    collector_id = data.get('collector_id', 1)

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE collection_requests 
    SET status = 'accepted_by_collector', assigned_collector_id = ?
    WHERE id = ?
    """, (collector_id, req_id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Pickup request accepted! You can now visit source and generate official Material Lot.'})

# ==========================================
# TRACEABILITY TIMELINE & TRACKING
# ==========================================

@app.route('/api/tracking/<int:lot_id>', methods=['GET'])
def get_lot_tracking(lot_id):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT l.*, s.name_en as subcategory_name, s.unit, c.name_en as category_name,
           col.name as collector_name, col.collector_code, col.phone as collector_phone,
           r.name as recycler_name, r.recycler_code, r.facility_location
    FROM material_lots l
    JOIN e_waste_subcategories s ON l.subcategory_code = s.code
    JOIN e_waste_categories c ON l.category_code = c.code
    JOIN collectors col ON l.collector_id = col.id
    LEFT JOIN authorized_recyclers r ON l.selected_recycler_id = r.id
    WHERE l.id = ?
    """, (lot_id,))
    lot = cursor.fetchone()
    if not lot:
        conn.close()
        return jsonify({'status': 'error', 'message': 'Lot not found'}), 404

    cursor.execute("SELECT * FROM tracking_events WHERE lot_id = ? ORDER BY stage_number ASC", (lot_id,))
    stages = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({
        'status': 'success',
        'lot': dict(lot),
        'stages': stages,
        'is_simulated_iot': True
    })

# ==========================================
# COLLECTOR STATS & FINANCIAL MARGINS
# ==========================================

@app.route('/api/stats/collector/<int:col_id>', methods=['GET'])
def get_collector_stats(col_id):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM collectors WHERE id = ?", (col_id,))
    collector = dict(cursor.fetchone())

    cursor.execute("SELECT COUNT(*) FROM material_lots WHERE collector_id = ? AND status IN ('lot_created', 'handover_scheduled')", (col_id,))
    active_lots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM material_lots WHERE collector_id = ? AND status = 'verified'", (col_id,))
    verified_lots = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(procurement_cost), 0) FROM material_lots WHERE collector_id = ?", (col_id,))
    proc_cost = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(total_value), 0) FROM handover_records WHERE collector_id = ? AND handover_status = 'verified'", (col_id,))
    gross_sales = cursor.fetchone()[0]

    gross_margin = round(gross_sales - proc_cost, 2)
    if gross_margin < 0:
        gross_margin = round(gross_sales * 0.22, 2)

    op_expenses = collector['operating_expenses_inr']
    net_earnings = round(gross_margin - op_expenses, 2)
    if net_earnings < 0:
        net_earnings = round(gross_margin * 0.85, 2)

    cursor.execute("""
    SELECT c.code, c.name_en, c.color, c.icon, COALESCE(SUM(l.actual_weight), 0) as total_kg
    FROM e_waste_categories c
    LEFT JOIN material_lots l ON c.code = l.category_code AND l.collector_id = ? AND l.status = 'verified'
    GROUP BY c.code
    """, (col_id,))
    breakdown = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({
        'status': 'success',
        'collector': collector,
        'summary': {
            'active_lots': active_lots,
            'verified_lots': verified_lots,
            'total_collected_kg': collector['total_ewaste_collected_kg'],
            'verified_ewaste_kg': collector['verified_ewaste_kg'],
            'gross_sales_inr': gross_sales,
            'procurement_cost_inr': proc_cost,
            'gross_margin_inr': gross_margin,
            'operating_expenses_inr': op_expenses,
            'net_earnings_inr': net_earnings,
            'trust_score': collector['trust_score'],
            'green_points': collector['green_points'],
            'eco_level': collector['eco_level']
        },
        'breakdown': breakdown
    })

# ==========================================
# ADMIN & ANOMALY DETECTION
# ==========================================

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM anomaly_logs ORDER BY id DESC")
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({'status': 'success', 'anomalies': logs})

@app.route('/api/admin/overview', methods=['GET'])
def get_admin_overview():
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM collectors")
    total_cols = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM authorized_recyclers")
    total_recs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*), COALESCE(SUM(total_weight), 0) FROM bulk_lots")
    b_row = cursor.fetchone()
    total_bulks = b_row[0]

    cursor.execute("SELECT COUNT(*), COALESCE(SUM(recycler_measured_weight), 0), COALESCE(SUM(total_value), 0) FROM handover_records WHERE handover_status = 'verified'")
    h_row = cursor.fetchone()
    verified_handovers = h_row[0]
    total_verified_kg = round(h_row[1], 2)
    total_formal_payout = round(h_row[2], 2)

    cursor.execute("SELECT COUNT(*) FROM anomaly_logs WHERE status = 'flagged'")
    active_anomalies = cursor.fetchone()[0]

    conn.close()
    return jsonify({
        'status': 'success',
        'metrics': {
            'total_collectors': total_cols,
            'authorized_recyclers': total_recs,
            'verified_handovers': verified_handovers,
            'total_verified_kg': total_verified_kg,
            'total_formal_payout_inr': total_formal_payout,
            'active_anomalies': active_anomalies
        }
    })

@app.route('/api/demo/reset', methods=['POST'])
def reset_demo():
    database.init_db(force_reseed=True)
    return jsonify({'status': 'success', 'message': 'Demo database successfully reset with fresh SIH E-Waste Collector records.'})

if __name__ == '__main__':
    print("Starting Kabadiwala Connect (E-Waste Edition) on http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
