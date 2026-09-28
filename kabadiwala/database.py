"""
database.py - SQLite Database Setup and Management for Kabadiwala Connect
Smart India Hackathon: Bringing the Informal E-Waste Collector into the Formal Recycling Chain
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kabadiwala.db')

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db(force_reseed=False):
    """Initializes schema and seeds demo data if empty or forced."""
    conn = get_db()
    cursor = conn.cursor()

    if force_reseed:
        cursor.execute("DROP TABLE IF EXISTS tracking_events")
        cursor.execute("DROP TABLE IF EXISTS anomaly_logs")
        cursor.execute("DROP TABLE IF EXISTS payments")
        cursor.execute("DROP TABLE IF EXISTS handover_records")
        cursor.execute("DROP TABLE IF EXISTS bulk_lots")
        cursor.execute("DROP TABLE IF EXISTS material_lots")
        cursor.execute("DROP TABLE IF EXISTS recycler_offers")
        cursor.execute("DROP TABLE IF EXISTS collection_requests")
        cursor.execute("DROP TABLE IF EXISTS price_dataset")
        cursor.execute("DROP TABLE IF EXISTS authorized_recyclers")
        cursor.execute("DROP TABLE IF EXISTS e_waste_subcategories")
        cursor.execute("DROP TABLE IF EXISTS e_waste_categories")
        cursor.execute("DROP TABLE IF EXISTS collectors")

    # 1. Collectors Table (Primary Actor)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collector_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        service_area TEXT NOT NULL,
        masked_id TEXT NOT NULL,
        verification_status TEXT DEFAULT 'Verified',
        trust_score INTEGER DEFAULT 95,
        rating REAL DEFAULT 4.90,
        rating_count INTEGER DEFAULT 34,
        total_lots_created INTEGER DEFAULT 18,
        total_ewaste_collected_kg REAL DEFAULT 245.0,
        verified_ewaste_kg REAL DEFAULT 218.5,
        gross_sales_inr REAL DEFAULT 34850.0,
        gross_margin_inr REAL DEFAULT 6420.0,
        operating_expenses_inr REAL DEFAULT 180.0,
        green_points INTEGER DEFAULT 1420,
        eco_level TEXT DEFAULT 'Recycling Champion',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. E-Waste Categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS e_waste_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        name_mr TEXT NOT NULL,
        name_ta TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        impact_factor REAL DEFAULT 25.0,
        hazardous_hazard_level TEXT NOT NULL,
        description TEXT NOT NULL
    )
    """)

    # 3. E-Waste Subcategories with Indicative Price Bands
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS e_waste_subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_code TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        indicative_min_price REAL NOT NULL,
        indicative_max_price REAL NOT NULL,
        historical_avg_price REAL NOT NULL,
        unit TEXT DEFAULT 'kg',
        description TEXT NOT NULL,
        FOREIGN KEY (category_code) REFERENCES e_waste_categories(code)
    )
    """)

    # 4. Authorized Recyclers (Formal Ecosystem)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS authorized_recyclers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recycler_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        authorization_status TEXT NOT NULL,
        license_no TEXT NOT NULL,
        facility_location TEXT NOT NULL,
        city TEXT NOT NULL,
        service_area TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        accepted_categories_json TEXT NOT NULL,
        min_lot_quantity_kg REAL DEFAULT 20.0,
        pickup_available INTEGER DEFAULT 1,
        rating REAL DEFAULT 4.90,
        verification_status TEXT DEFAULT 'Authorized',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. Live Recycler Competitive Offers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recycler_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recycler_id INTEGER NOT NULL,
        category_code TEXT NOT NULL,
        subcategory_code TEXT NOT NULL,
        offered_rate_per_kg REAL NOT NULL,
        min_quantity_kg REAL DEFAULT 10.0,
        payment_terms TEXT DEFAULT 'Instant UPI upon weighbridge clearance',
        valid_until TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recycler_id) REFERENCES authorized_recyclers(id)
    )
    """)

    # 6. Bulk Lots (Merged aggregation)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bulk_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bulk_code TEXT UNIQUE NOT NULL,
        collector_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category_code TEXT NOT NULL,
        total_weight REAL NOT NULL,
        total_procurement_cost REAL DEFAULT 0.0,
        status TEXT DEFAULT 'assembled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collector_id) REFERENCES collectors(id)
    )
    """)

    # 7. Material Lots (Individual Digital Lots)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS material_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_code TEXT UNIQUE NOT NULL,
        collector_id INTEGER NOT NULL,
        category_code TEXT NOT NULL,
        subcategory_code TEXT NOT NULL,
        photo_url TEXT,
        estimated_weight REAL NOT NULL,
        actual_weight REAL,
        condition TEXT DEFAULT 'Grade A',
        source_type TEXT DEFAULT 'Local Repair Hubs',
        collection_date TEXT,
        location TEXT DEFAULT 'New Delhi',
        status TEXT DEFAULT 'lot_created',
        selected_recycler_id INTEGER,
        offered_rate REAL,
        procurement_cost REAL DEFAULT 0.0,
        notes TEXT,
        is_bulk_merged INTEGER DEFAULT 0,
        bulk_lot_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collector_id) REFERENCES collectors(id),
        FOREIGN KEY (selected_recycler_id) REFERENCES authorized_recyclers(id),
        FOREIGN KEY (bulk_lot_id) REFERENCES bulk_lots(id)
    )
    """)

    # 8. Digital Handover Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS handover_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handover_code TEXT UNIQUE NOT NULL,
        lot_type TEXT DEFAULT 'single',
        lot_id INTEGER,
        bulk_lot_id INTEGER,
        collector_id INTEGER NOT NULL,
        recycler_id INTEGER NOT NULL,
        collector_declared_weight REAL NOT NULL,
        recycler_measured_weight REAL,
        weight_difference REAL DEFAULT 0.0,
        mismatch_flag INTEGER DEFAULT 0,
        agreed_rate_per_kg REAL NOT NULL,
        total_value REAL NOT NULL,
        transport_mode TEXT DEFAULT 'Electric 3-Wheeler Cargo',
        vehicle_no TEXT DEFAULT 'DL-1ER-4521',
        weighbridge_slip_no TEXT,
        quality_grade TEXT DEFAULT 'Grade A',
        payment_status TEXT DEFAULT 'Pending',
        handover_status TEXT DEFAULT 'in_transit',
        notes TEXT,
        handover_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_timestamp TIMESTAMP,
        FOREIGN KEY (collector_id) REFERENCES collectors(id),
        FOREIGN KEY (recycler_id) REFERENCES authorized_recyclers(id)
    )
    """)

    # 9. Payments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_code TEXT UNIQUE NOT NULL,
        handover_id INTEGER NOT NULL,
        collector_id INTEGER NOT NULL,
        recycler_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Instant UPI',
        payment_status TEXT DEFAULT 'Paid',
        payment_reference TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (handover_id) REFERENCES handover_records(id)
    )
    """)

    # 10. Secondary Generator Collection Requests
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collection_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_code TEXT UNIQUE NOT NULL,
        generator_name TEXT NOT NULL,
        generator_type TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        category_code TEXT NOT NULL,
        subcategory_code TEXT,
        approx_weight REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        assigned_collector_id INTEGER,
        preferred_time TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_collector_id) REFERENCES collectors(id)
    )
    """)

    # 11. Price Dataset Table (Historical & Market Tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS price_dataset (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_code TEXT NOT NULL,
        subcategory_code TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        source TEXT NOT NULL,
        condition TEXT NOT NULL
    )
    """)

    # 12. Anomaly Logs Table (Fraud & Outlier Detection)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anomaly_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anomaly_type TEXT NOT NULL,
        lot_id INTEGER,
        handover_id INTEGER,
        description TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'flagged'
    )
    """)

    # 13. Tracking Events (10-Stage Traceability Timeline)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tracking_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER NOT NULL,
        stage_number INTEGER NOT NULL,
        stage_name TEXT NOT NULL,
        location_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES material_lots(id) ON DELETE CASCADE
    )
    """)

    conn.commit()

    # Check if seed is needed
    cursor.execute("SELECT COUNT(*) FROM e_waste_categories")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_e_waste_data(conn)
    conn.close()

def seed_e_waste_data(conn):
    cursor = conn.cursor()

    # 1. Categories
    categories = [
        ('pcb', 'Printed Circuit Boards (PCB)', '?????? ????? (PCB)', '?????? ????? (PCB)', '?????????? ???? (PCB)', 'cpu', '#10b981', 25.0, 'High (Lead/Bromine)', 'High valuable precious metals (Au, Ag, Cu, Pd) requiring formal pyrometallurgical refining'),
        ('cables', 'Cables & Insulated Wires', '?????? ?? ????? ?? ???', '?????? ? ??????????? ????', '????????? ??????? ????????', 'cable', '#3b82f6', 15.0, 'Moderate (PVC Dioxins)', 'High copper content; informal burning creates carcinogenic dioxins, formal stripping required'),
        ('batteries', 'Lithium & Industrial Batteries', '?????? ?? ???? ????????', '?????? ? ??? ???????', '????????? ??????????', 'battery-charging', '#ef4444', 35.0, 'Severe (Thermal Runaway/Cobalt)', 'Cobalt, nickel, and lithium recovery with certified neutralization to prevent fire hazards'),
        ('displays', 'Displays (LCD, LED & CRT)', '???????? ?? ??????', '???????? ? ???????', '??????? (LCD/CRT)', 'monitor', '#8b5cf6', 18.0, 'High (Mercury/Lead Glass)', 'Mercury backlights and leaded CRT funnel glass needing formal vacuum dismantling'),
        ('motors', 'Electric Motors & Alternators', '?????????? ?????? ?? ???????', '?????? ? ???????', '???? ???????????', 'cog', '#f59e0b', 12.0, 'Low-Moderate', 'Heavy copper winding and rare-earth neodymium magnet recovery'),
        ('devices', 'Discarded Electronics & Laptops', '?????? ?????????????? ?????', '????? ?????? ? ????????', '???????????????? ?????????', 'laptop', '#06b6d4', 20.0, 'Moderate-High', 'End-of-life laptops, tablets, mobile phones, and SMPS power units ready for systematic depopulation')
    ]

    cursor.executemany("""
    INSERT INTO e_waste_categories 
    (code, name_en, name_hi, name_mr, name_ta, icon, color, impact_factor, hazardous_hazard_level, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, categories)

    # 2. Subcategories with Indicative Price Bands
    subcategories = [
        # PCB
        ('pcb', 'pcb_motherboard', 'High-Grade Computer Motherboard', '???????? PCB', 180.0, 220.0, 198.0, 'kg', 'High gold/palladium plating on CPU sockets and RAM slots'),
        ('pcb', 'pcb_mixed', 'Mixed Commercial Electronics PCB', '??????? PCB', 120.0, 155.0, 138.0, 'kg', 'Consumer electronics circuit boards with IC components'),
        ('pcb', 'pcb_server', 'Telecom / Server Grade PCB', '????? ? ??????? PCB', 240.0, 310.0, 275.0, 'kg', 'Heavy gold edge connectors, multi-layer high precious metal content'),
        ('pcb', 'pcb_lowgrade', 'Low-Grade Single-Layer Brown PCB', '??-????? ?????? PCB', 45.0, 70.0, 58.0, 'kg', 'Single-sided CRT television and power boards with minimal gold traces'),

        # Cables
        ('cables', 'cables_heavy_copper', 'Heavy Copper Power Cable', '???? ???? ???? ????', 280.0, 350.0, 315.0, 'kg', 'Thick insulated single-core copper mains cables'),
        ('cables', 'cables_bright_bare', 'Stripped Bright Bare Copper', '???? ??? ????? ?????', 580.0, 650.0, 615.0, 'kg', 'Clean, stripped bright metallic copper conductor strands'),
        ('cables', 'cables_mixed_ribbon', 'Mixed Ribbon & Ethernet Cable', '??????? ???? / ???? ????', 95.0, 140.0, 118.0, 'kg', 'Computer peripheral data wires, USB, and LAN networking cables'),
        ('cables', 'cables_aluminum', 'Aluminum Wiring Scrap', '??????????? ????', 110.0, 150.0, 130.0, 'kg', 'Overhead distribution and insulated domestic aluminum conductors'),

        # Batteries
        ('batteries', 'battery_li_ion', 'Li-Ion Laptop & Phone Battery Packs', '??????/?????? ?????? ?????', 110.0, 160.0, 135.0, 'kg', 'Rechargeable pouch and 18650 cylindrical cells with high cobalt/lithium content'),
        ('batteries', 'battery_ev_lifepo4', 'EV & Energy Storage LiFePO4 Modules', 'EV / ???? LiFePO4 ?????', 140.0, 195.0, 168.0, 'kg', 'Lithium iron phosphate packs from 2-wheelers and solar storage'),
        ('batteries', 'battery_lead_acid', 'Lead-Acid Inverter & UPS Battery', '???-???? ???????? ?????', 75.0, 95.0, 84.0, 'kg', 'Heavy lead grid plates and neutralized casing'),

        # Displays
        ('displays', 'display_lcd_panel', 'LCD / LED Flat Panel Assemblies', 'LCD / LED ??????? ????', 35.0, 55.0, 44.0, 'kg', 'Intact flat display panels with driver IC flex strips'),
        ('displays', 'display_crt_glass', 'CRT Glass & Deflection Yoke', 'CRT ???? ? ???? ???', 8.0, 15.0, 11.0, 'kg', 'Funnel lead glass and copper winding deflection yokes'),

        # Motors
        ('motors', 'motors_copper_wound', 'Copper-Wound Electric Motors', '???? ???????? ?????????? ????', 95.0, 140.0, 118.0, 'kg', 'Induction motors from washing machines, mixers, and pumps'),
        ('motors', 'motors_magnet_actuator', 'Magnet-Bearing HDD Actuators', '????? ?????? ??????? ???????', 60.0, 85.0, 72.0, 'kg', 'Voice coil neodymium magnets from decommissioned computer hard drives'),

        # Devices
        ('devices', 'devices_scrap_laptops', 'Discarded Scrap Laptops & Tablets', '?????? ??????? ????????', 180.0, 260.0, 220.0, 'unit', 'Complete dead laptops with motherboard, chassis, and optical drives'),
        ('devices', 'devices_scrap_mobiles', 'End-of-Life Mobile Phones', '?????? ?????? ???', 25.0, 45.0, 35.0, 'unit', 'Feature phones and damaged smartphones with motherboards intact'),
        ('devices', 'devices_smps_power', 'SMPS Computer Power Supply Units', '???????? SMPS ???? ??????', 40.0, 65.0, 52.0, 'kg', 'Steel casing with transformer coils, heatsinks, and cables'),
        ('devices', 'devices_mixed_plastics', 'Electronic Plastic Chassis & Casings', '???????????? ????????? ????', 18.0, 28.0, 22.0, 'kg', 'ABS, HIPS, and Polycarbonate flame-retardant computer housings')
    ]

    cursor.executemany("""
    INSERT INTO e_waste_subcategories 
    (category_code, code, name_en, name_hi, indicative_min_price, indicative_max_price, historical_avg_price, unit, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, subcategories)

    # 3. Authorized Recyclers (Formal Ecosystem)
    recyclers = [
        ('KC-REC-1001', 'GreenCycle Advanced E-Waste Solutions', 'CPCB / SPCB Authorized', 'CPCB/EW-REG/DL-092/2024', 'Plot 42, Sector 5, Bawana Industrial Area', 'New Delhi', 'North & West Delhi, NCR', '+91 11 2789 4401', 'contact@greencycle.in', json.dumps(['pcb', 'cables', 'batteries', 'devices']), 20.0, 1, 4.94, 'Authorized'),
        ('KC-REC-1002', 'EcoMetals Smelting & Refining Corp', 'SPCB Authorized State Facility', 'SPCB/EW-AUTH/MH-118/2023', 'Plot 18, MIDC Taloja Chemical Zone', 'Navi Mumbai', 'Mumbai MMR, Thane, Pune', '+91 22 2741 8820', 'procurement@ecometals.in', json.dumps(['pcb', 'cables', 'motors']), 25.0, 1, 4.89, 'Authorized'),
        ('KC-REC-1003', 'Bharat Circular Precious Metals MRF', 'CPCB Authorized Mega MRF', 'CPCB/EW-REG/KA-044/2024', 'Phase 4, Peenya Industrial Complex', 'Bengaluru', 'Bengaluru Urban & Rural', '+91 80 2839 1234', 'support@bharatprecious.org', json.dumps(['pcb', 'batteries', 'displays', 'devices']), 15.0, 1, 4.91, 'Authorized')
    ]

    cursor.executemany("""
    INSERT INTO authorized_recyclers 
    (recycler_code, name, authorization_status, license_no, facility_location, city, service_area, contact_phone, contact_email, accepted_categories_json, min_lot_quantity_kg, pickup_available, rating, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, recyclers)

    # 4. Primary Collector Partner (Santosh Bhai - KC-COL-10001)
    collectors = [
        ('KC-COL-10001', 'Santosh Bhai', '+91 98234 56789', 'Shop 7, Scrap Hub, Old Rohtak Road', 'New Delhi', 'Sector 21, 22, Dwarka & Janakpuri', 'CPCB-REF: XXXX-XXXX-3412', 'Verified', 95, 4.90, 34, 18, 245.0, 218.5, 34850.0, 6420.0, 180.0, 1420, 'Recycling Champion'),
        ('KC-COL-10002', 'Murugan Swamy', '+91 97890 12345', 'Unit 3, Circular Road, Anna Nagar', 'Chennai', 'Anna Nagar & Ambattur Hub', 'TNPCB-REF: XXXX-XXXX-7721', 'Verified', 91, 4.82, 22, 11, 165.0, 152.0, 22400.0, 4100.0, 140.0, 980, 'Eco Collector'),
        ('KC-COL-10003', 'Tukaram Shinde', '+91 98223 99887', 'Gala 5, Scrap Yard, Swargate', 'Pune', 'Swargate, Kothrud & Hadapsar', 'MPCB-REF: XXXX-XXXX-6140', 'Verified', 96, 4.95, 45, 24, 320.0, 310.0, 48200.0, 8900.0, 220.0, 1850, 'Sustainability Hero')
    ]

    cursor.executemany("""
    INSERT INTO collectors 
    (collector_code, name, phone, address, city, service_area, masked_id, verification_status, trust_score, rating, rating_count, total_lots_created, total_ewaste_collected_kg, verified_ewaste_kg, gross_sales_inr, gross_margin_inr, operating_expenses_inr, green_points, eco_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, collectors)

    # 5. Live Recycler Competitive Offers
    offers = [
        # GreenCycle (Recycler 1)
        (1, 'pcb', 'pcb_motherboard', 205.0, 15.0, 'Instant UPI upon weighbridge clearance', '2026-12-31'),
        (1, 'pcb', 'pcb_mixed', 148.0, 20.0, 'Instant UPI upon weighbridge clearance', '2026-12-31'),
        (1, 'cables', 'cables_heavy_copper', 335.0, 20.0, 'Instant UPI upon weighbridge clearance', '2026-12-31'),
        (1, 'batteries', 'battery_li_ion', 152.0, 10.0, 'Bank NEFT within 4 hours', '2026-12-31'),
        (1, 'devices', 'devices_scrap_laptops', 245.0, 5.0, 'Instant UPI upon weighbridge clearance', '2026-12-31'),

        # EcoMetals (Recycler 2)
        (2, 'pcb', 'pcb_motherboard', 210.0, 25.0, 'Immediate Bank RTGS', '2026-12-31'),
        (2, 'pcb', 'pcb_mixed', 152.0, 30.0, 'Immediate Bank RTGS', '2026-12-31'),
        (2, 'cables', 'cables_heavy_copper', 340.0, 25.0, 'Immediate Bank RTGS', '2026-12-31'),
        (2, 'motors', 'motors_copper_wound', 132.0, 20.0, 'Immediate Bank RTGS', '2026-12-31'),

        # Bharat Precious (Recycler 3)
        (3, 'pcb', 'pcb_motherboard', 202.0, 10.0, 'Instant UPI payment', '2026-12-31'),
        (3, 'pcb', 'pcb_server', 295.0, 10.0, 'Instant UPI payment', '2026-12-31'),
        (3, 'pcb', 'pcb_mixed', 144.0, 15.0, 'Instant UPI payment', '2026-12-31'),
        (3, 'batteries', 'battery_li_ion', 155.0, 15.0, 'Instant UPI payment', '2026-12-31')
    ]

    cursor.executemany("""
    INSERT INTO recycler_offers 
    (recycler_id, category_code, subcategory_code, offered_rate_per_kg, min_quantity_kg, payment_terms, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, offers)

    # 6. Price Dataset for Historical Trend Discovery
    now = datetime.now()
    price_data = []
    for i in range(12):
        d = (now - timedelta(days=(11 - i) * 15)).strftime('%Y-%m-%d')
        price_data.append(('pcb', 'pcb_mixed', 'New Delhi NCR', d, 130.0 + (i * 1.8), 'CPCB Certified Industrial Auction', 'Grade B Mixed'))
        price_data.append(('pcb', 'pcb_motherboard', 'New Delhi NCR', d, 185.0 + (i * 2.2), 'CPCB Certified Industrial Auction', 'Grade A Complete'))
        price_data.append(('cables', 'cables_heavy_copper', 'New Delhi NCR', d, 300.0 + (i * 3.5), 'Copper Exchange Index', 'Grade A Heavy'))

    cursor.executemany("""
    INSERT INTO price_dataset 
    (category_code, subcategory_code, location, date, price_per_kg, source, condition)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, price_data)

    # 7. Seed Active & Historical Material Lots for Santosh Bhai (KC-COL-10001)
    t1_time = (now - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("""
    INSERT INTO material_lots 
    (lot_code, collector_id, category_code, subcategory_code, photo_url, estimated_weight, actual_weight, condition, source_type, collection_date, location, status, selected_recycler_id, offered_rate, procurement_cost, notes, created_at, updated_at)
    VALUES ('KC-LOT-10041', 1, 'pcb', 'pcb_motherboard', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60', 16.0, 15.5, 'Grade A - High Yield', 'Local Computer Repair Hubs', ?, 'Dwarka Sector 21, New Delhi', 'verified', 1, 205.0, 2400.0, 'Clean Intel & AMD server/desktop boards, depopulated of heatsinks.', ?, ?)
    """, (t1_time, t1_time, t1_time))
    lot1_id = cursor.lastrowid

    cursor.execute("""
    INSERT INTO handover_records 
    (handover_code, lot_id, collector_id, recycler_id, collector_declared_weight, recycler_measured_weight, weight_difference, mismatch_flag, agreed_rate_per_kg, total_value, payment_status, handover_status, notes, handover_timestamp, verified_timestamp)
    VALUES ('KC-HND-10018', ?, 1, 1, 15.5, 15.4, 0.1, 0, 205.0, 3157.0, 'Paid', 'verified', 'Calibrated weighbridge certified. Clean batch.', ?, ?)
    """, (lot1_id, t1_time, t1_time))
    hnd1_id = cursor.lastrowid

    cursor.execute("""
    INSERT INTO payments 
    (payment_code, handover_id, collector_id, recycler_id, amount, payment_method, payment_status, payment_reference, timestamp)
    VALUES ('KC-PAY-50018', ?, 1, 1, 3157.0, 'Instant UPI', 'Paid', 'UPI/260907100418/CLEAR', ?)
    """, (hnd1_id, t1_time))

    # Lot 2: Ready for Recycler Handover (Active Demo Lot)
    t2_time = (now - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("""
    INSERT INTO material_lots 
    (lot_code, collector_id, category_code, subcategory_code, photo_url, estimated_weight, actual_weight, condition, source_type, collection_date, location, status, selected_recycler_id, offered_rate, procurement_cost, notes, created_at, updated_at)
    VALUES ('KC-LOT-10045', 1, 'pcb', 'pcb_mixed', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60', 24.0, 22.8, 'Mixed / Unsorted', 'Doorstep Collection & Repair Shops', ?, 'Janakpuri West Depot, New Delhi', 'handover_scheduled', 1, 148.0, 2500.0, 'Aggregated from 8 repair centers. Mixed IC chips and daughtercards.', ?, ?)
    """, (t2_time, t2_time, t2_time))
    lot2_id = cursor.lastrowid

    cursor.execute("""
    INSERT INTO handover_records 
    (handover_code, lot_id, collector_id, recycler_id, collector_declared_weight, recycler_measured_weight, weight_difference, mismatch_flag, agreed_rate_per_kg, total_value, payment_status, handover_status, notes, handover_timestamp)
    VALUES ('KC-HND-10023', ?, 1, 1, 22.8, NULL, 0.0, 0, 148.0, 3374.40, 'Pending', 'in_transit', 'En route to Bawana Industrial Recovery Facility. Manifested by Santosh Bhai.', ?)
    """, (lot2_id, t2_time))

    create_e_waste_milestones(cursor, lot2_id, current_stage=7)

    # Lot 3: Freshly Created Lot (Awaiting Recycler Matching)
    t3_time = (now - timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("""
    INSERT INTO material_lots 
    (lot_code, collector_id, category_code, subcategory_code, photo_url, estimated_weight, actual_weight, condition, source_type, collection_date, location, status, procurement_cost, notes, created_at)
    VALUES ('KC-LOT-10048', 1, 'cables', 'cables_heavy_copper', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60', 18.5, 18.5, 'Grade A - High Yield', 'Industrial Demolition & Scrap Yards', ?, 'Sector 22 Scrap Hub, New Delhi', 'lot_created', 4600.0, 'Heavy unstripped copper power cables, 100% thick strands.', ?)
    """, (t3_time, t3_time))
    lot3_id = cursor.lastrowid
    create_e_waste_milestones(cursor, lot3_id, current_stage=3)

    # 8. Seed Secondary Business / Household Collection Requests
    cursor.execute("""
    INSERT INTO collection_requests 
    (request_code, generator_name, generator_type, phone, address, category_code, approx_weight, status, assigned_collector_id, preferred_time, notes)
    VALUES ('KC-GEN-10012', 'InfoTech Hardware Solutions Pvt Ltd', 'Small IT Office / BPO', '+91 98112 33445', 'B-104, IT Park, Okhla Phase 3, New Delhi', 'pcb', 35.0, 'accepted_by_collector', 1, 'Tomorrow Morning (10 AM - 12 PM)', 'Decommissioned server cards, RAM chips, and network switches.')
    """)

    cursor.execute("""
    INSERT INTO collection_requests 
    (request_code, generator_name, generator_type, phone, address, category_code, approx_weight, status, preferred_time, notes)
    VALUES ('KC-GEN-10015', 'QuickFix Laptop & Mobile Clinic', 'Repair Centre', '+91 99201 55667', 'Shop 14, Electronics Market, Nehru Place, New Delhi', 'batteries', 18.0, 'pending', 'Today Evening (4 PM - 6 PM)', 'Swollen and dead laptop battery packs safely packed in sand-lined containers.')
    """)

    # 9. Seed Sample Anomaly Log for Admin Review
    cursor.execute("""
    INSERT INTO anomaly_logs 
    (anomaly_type, lot_id, description, severity, status)
    VALUES ('Price Discrepancy Outlier', ?, 'Declared transaction rate for Mixed PCB was ?42.0/kg, which is 62% below the CPCB market reference range (?120-155/kg). Flagged for potential unrecorded cash diversion.', 'high', 'flagged')
    """, (lot1_id,))

    conn.commit()

def create_e_waste_milestones(cursor, lot_id, current_stage=1):
    """Generates the 10-stage visual e-waste journey."""
    stages = [
        (1, "E-Waste Collected", "Doorstep / Informal Field Source", 28.5912, 77.0621),
        (2, "Material Sorted & Depopulated", "Collector Segregation Yard (Old Rohtak Road)", 28.6150, 77.0850),
        (3, "Digital Lot Created & Weighed", "Collector Digital Scale Terminal", 28.6155, 77.0855),
        (4, "Price Discovered & Compared", "Platform Market Discovery Engine", 28.6200, 77.0800),
        (5, "Authorized Recycler Matched", "CPCB Licensed Recycler Matching Hub", 28.6300, 77.0700),
        (6, "Offer Accepted & Handover Scheduled", "Formal Contract Manifest Generated", 28.6400, 77.0600),
        (7, "Consignment In Transit", "Secured HazMat Transport Corridor", 28.6700, 77.0500),
        (8, "Recycler Received at Gate", "Bawana Industrial Recovery Facility", 28.7900, 77.0400),
        (9, "Weighbridge & Assay Verified", "Certified Material Testing Weighbridge", 28.7915, 77.0410),
        (10, "? Formal Recycling Verified", "National E-Waste Traceability Registry (EPR Sealed)", 28.7920, 77.0420)
    ]

    for stage_num, stage_name, loc_name, lat, lng in stages:
        if stage_num < current_stage:
            status = 'completed'
        elif stage_num == current_stage:
            status = 'current'
        else:
            status = 'pending'

        cursor.execute("""
        INSERT INTO tracking_events (lot_id, stage_number, stage_name, location_name, lat, lng, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (lot_id, stage_num, stage_name, loc_name, lat, lng, status))

if __name__ == '__main__':
    print(f"Initializing E-Waste database at: {DB_PATH}")
    init_db(force_reseed=True)
    print("Database successfully initialized with SIH Informal E-Waste Collector ecosystem!")
