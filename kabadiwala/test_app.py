"""
test_app.py - Automated End-to-End Test Suite for Kabadiwala Connect (E-Waste Edition)
Verifies all 10 core milestones of the informal collector-first recycling chain.
"""

import unittest
import json
from app import app
import database

class TestEWasteCollectorPlatform(unittest.TestCase):
    def setUp(self):
        database.init_db(force_reseed=True)
        self.client = app.test_client()

    def test_01_categories_and_subcategories(self):
        """Test e-waste categories and subcategories retrieval"""
        res = self.client.get('/api/categories')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(len(data['categories']) >= 6)
        pcb_cat = [c for c in data['categories'] if c['code'] == 'pcb'][0]
        self.assertTrue(len(pcb_cat['subcategories']) >= 3)

    def test_02_ai_waste_scanner(self):
        """Test AI E-Waste scanner classification"""
        res = self.client.post('/api/scanner/detect', json={
            'sample_key': 'pcb_motherboard'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['category_code'], 'pcb')
        self.assertEqual(data['subcategory_code'], 'pcb_motherboard')
        self.assertTrue(data['confidence'] > 90)
        self.assertIn('disclaimer', data)

    def test_03_price_discovery_engine(self):
        """Test Price Discovery engine returns ranges, trends and offers"""
        res = self.client.get('/api/price-discovery?subcategory_code=pcb_mixed')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('market_range', data)
        self.assertTrue(data['market_range']['min'] > 0)
        self.assertTrue(len(data['historical_trend']) > 0)
        self.assertTrue(len(data['recycler_offers']) > 0)

    def test_04_recycler_matching_engine(self):
        """Test AI Recycler matching algorithm with match score"""
        res = self.client.post('/api/recyclers/match', json={
            'subcategory_code': 'pcb_motherboard',
            'weight': 25.0,
            'location': 'New Delhi'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        recs = data['recommendations']
        self.assertTrue(len(recs) > 0)
        self.assertTrue(recs[0]['match_score'] >= 80)
        self.assertTrue('license_no' in recs[0])

    def test_05_material_lot_creation(self):
        """Test creating a new Digital Material Lot (KC-LOT-XXXXX)"""
        res = self.client.post('/api/lots', json={
            'collector_id': 1,
            'category_code': 'pcb',
            'subcategory_code': 'pcb_motherboard',
            'estimated_weight': 15.0,
            'actual_weight': 14.5,
            'condition': 'Grade A - High Yield',
            'source_type': 'Local Repair Hubs',
            'procurement_cost': 2200.0,
            'notes': 'Test batch of server boards'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['lot_code'].startswith('KC-LOT-'))

    def test_06_bulk_lot_merging(self):
        """Test merging smaller lots into a Bulk Lot (KC-BULK-XXXXX)"""
        r1 = self.client.post('/api/lots', json={
            'collector_id': 1, 'category_code': 'pcb', 'subcategory_code': 'pcb_mixed',
            'actual_weight': 8.0, 'procurement_cost': 900.0
        })
        r2 = self.client.post('/api/lots', json={
            'collector_id': 1, 'category_code': 'pcb', 'subcategory_code': 'pcb_mixed',
            'actual_weight': 12.0, 'procurement_cost': 1400.0
        })
        id1 = r1.get_json()['lot_id']
        id2 = r2.get_json()['lot_id']

        res_merge = self.client.post('/api/bulk-lots/create', json={
            'collector_id': 1,
            'lot_ids': [id1, id2],
            'title': 'Consolidated Mixed Circuit Boards'
        })
        self.assertEqual(res_merge.status_code, 200)
        data = res_merge.get_json()
        self.assertTrue(data['bulk_code'].startswith('KC-BULK-'))
        self.assertEqual(data['total_weight'], 20.0)

    def test_07_digital_handover_creation(self):
        """Test generating a digital handover with transport manifest"""
        res = self.client.post('/api/handovers/create', json={
            'lot_type': 'single',
            'lot_id': 1,
            'collector_id': 1,
            'recycler_id': 1,
            'offer_price_per_kg': 260.0,
            'transport_mode': 'Electric 3-Wheeler Cargo',
            'vehicle_no': 'DL-1ER-4521'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['handover_code'].startswith('KC-HND-'))

    def test_08_recycler_weighbridge_verification_and_mismatch(self):
        """Test weighbridge verification, settlement calculation, and anomaly detection"""
        res = self.client.post('/api/handovers/1/verify-weighbridge', json={
            'weighbridge_weight': 17.1,
            'weighbridge_slip_no': 'WB-TEST-999',
            'quality_grade': 'Grade A',
            'recycler_rate_per_kg': 260.0,
            'notes': 'Test verified discrepancy'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['verification_status'], 'verified_discrepancy')
        self.assertAlmostEqual(data['weight_diff'], -0.9, places=2)
        self.assertTrue(data['anomaly_flagged'])
        self.assertGreater(data['final_amount'], 0)

    def test_09_secondary_generator_request_flow(self):
        """Test business/household collection request & collector acceptance"""
        res_req = self.client.post('/api/generators/requests', json={
            'generator_name': 'Apex Computer Repair Shop',
            'generator_type': 'Repair Centre',
            'phone': '+91 99887 66554',
            'address': 'Nehru Place Hub, New Delhi',
            'category_code': 'pcb',
            'approx_weight': 20.0
        })
        self.assertEqual(res_req.status_code, 200)
        req_code = res_req.get_json()['request_code']
        self.assertTrue(req_code.startswith('KC-GEN-'))

        res_list = self.client.get('/api/generators/requests')
        reqs = res_list.get_json()['requests']
        our_req = [r for r in reqs if r['request_code'] == req_code][0]

        res_accept = self.client.post(f'/api/generators/requests/{our_req["id"]}/accept', json={
            'collector_id': 1
        })
        self.assertEqual(res_accept.status_code, 200)

    def test_10_collector_stats_and_trust_score(self):
        """Test collector summary, commercial margins, and trust score"""
        res = self.client.get('/api/stats/collector/1')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        summary = data['summary']
        self.assertTrue(summary['trust_score'] >= 80)
        self.assertTrue(summary['gross_sales_inr'] > 0)
        self.assertTrue(summary['gross_margin_inr'] > 0)
        print("\nAll 10 Closed-Loop E-Waste Collector SIH Milestones Passed Successfully!")

if __name__ == '__main__':
    unittest.main()
