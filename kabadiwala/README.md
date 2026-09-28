# ♻️ Kabadiwala Connect
# ♻️ Kabadiwala Connect (E-Waste Edition)
> **"From Waste to Worth"**  
> *Smart India Hackathon Working Prototype*  
> **Problem Statement:** *"Bringing the Informal Collector into the Formal Recycling Chain"*
> **Problem Statement:** *"Bringing the Informal E-Waste Collector into the Formal Recycling Chain"*

---

## 🌟 Executive Summary
## 🌟 Core Product Philosophy

In India's waste management landscape, over **80% of recyclable material** is collected by millions of informal waste collectors (*Kabadiwalas*). Despite being the unsung green champions of our cities, they face:
1. **Opaque & fluctuating pricing** that drives exploitation.
2. **Manual and uncalibrated weighing disputes** with households.
3. **Lack of formal integration** with large industrial recovery and recycling facilities (MRFs).
4. **Zero formal recognition or rewards** for the massive carbon and landfill diversion they accomplish daily.
In strict alignment with the Smart India Hackathon problem statement:
- **Informal E-Waste Collectors (Kabadiwalas, scrap dealers, aggregators) are the PRIMARY platform users.**
- The platform does not treat informal collectors as mere pickup boys for households. Instead, it provides them with:
  1. **Data-driven price discovery** (transparent market price bands and historical auction trends).
  2. **Digital Material Lot creation (`KC-LOT-XXXXX`)** and **bulk lot aggregation (`KC-BULK-XXXXX`)**.
  3. **Direct matching with CPCB/SPCB authorized recyclers**.
  4. **Digital handover documentation (`KC-HND-XXXXX`)** with certified weighbridge verification.
  5. **Automated weight mismatch detection** to build mutual trust.
  6. **Digital collector identity & transparent Trust Score (0-100)**.
  7. **Commercial margin analytics** debunking the "free money" myth.
  8. **Full 10-stage traceability** from street collection to formal industrial smelting.

**Kabadiwala Connect** transforms this informal network into a digitized, transparent, and dignified closed-loop circular economy:
$$\text{Household User} \longrightarrow \text{Informal Kabadiwala} \longrightarrow \text{Formal Industrial Recycler}$$

---

## 🚀 Key Prototype Highlights & Innovations
## 🚀 Key Features Implemented

### 1. 🤖 AI Recyclable Waste Scanner
- Computer vision heuristic engine identifies material categories (**Plastic, Cardboard, Paper, Newspaper, Metal, Glass, E-Waste**) with 95%+ confidence.
- Displays platform guaranteed rate per kg and estimated waste value.
- **Transparency Safeguard**: Explicitly displays that photo-based AI estimation is an approximation, and final payout is strictly based on certified digital scale weighing upon arrival.
### 1. 🚚 Informal Collector Command Center (Primary Dashboard)
- **Profile**: Santosh Bhai (`KC-COL-10001`), Dwarka & Janakpuri Territory, New Delhi.
- **Collector Trust Score**: **95/100** (computed from verified weighbridge transactions & accuracy).
- **CPCB Masked Identification**: `CPCB-REF: XXXX-XXXX-3412` (Verified).
- **Financial Margins Breakdown**:
  - Total Procurement Cost (Paid to sources): **₹28,430**
  - Recycler Sales Value (Received): **₹34,850**
  - Gross Commercial Margin: **+₹6,420**
  - Operating Expenses (Cart/Transport): **₹180**
  - Estimated Net Earnings: **₹6,240**

### 2. ⚖️ Mixed Waste Support & Digital Scale Weighing
- Households can schedule pickups with multiple waste categories.
- Each category is calculated **separately** ($Actual\ Weight \times Fixed\ Rate$).
- Kabadiwala enters certified digital hanging scale readings on doorstep.
### 2. 📦 Digital Material Lot System & Bulk Merging
- Classifies e-waste by technical categories & subcategories:
  - **PCBs**: Motherboard PCB, Mixed PCB, Server/Telecom PCB, Low-grade Brown PCB
  - **Cables**: Heavy Copper Power Cable, Stripped Bright Bare Copper, Mixed Ribbon Wire, Aluminum Wire
  - **Batteries**: Li-Ion Laptop/Phone Packs, EV/Powerwall LiFePO4, Lead-Acid Inverter
  - **Displays**: LCD/LED Flat Panels, CRT Glass & Deflection Yokes
  - **Motors**: Copper-Wound Electric Motors, Magnet-Bearing Hard Drive Actuators
  - **Devices**: Discarded Scrap Laptops, Mobile Phones, SMPS Power Supplies, Mixed Electronic Plastics
- **Bulk Aggregation Engine**:
  - Collectors can merge multiple smaller lots into a wholesale **Bulk Lot (`KC-BULK-XXXXX`)** to unlock higher wholesale bids from recyclers.

### 3. 💵 Authentic Commercial Transaction Model
- **Debunking the "Free Money" myth**: The platform does not give free money to Kabadiwalas.
- Kabadiwala pays the household user at procurement rates (via Instant UPI QR code, Cash, or Wallet).
- Kabadiwala aggregates collected scrap in bulk inventory ("My Collected Waste") and delivers to formal industrial recyclers.
- Recyclers pay higher industrial wholesale rates, creating a transparent **commercial gross margin & net profit** for the Kabadiwala.
### 3. 📈 Price Discovery Engine & Historical Trends
- Shows real-time indicative market ranges (e.g. Mixed PCB: **₹120 – ₹155 / kg**, Historical Average: **₹138 / kg**).
- Interactive 6-month historical price trend line chart powered by Chart.js.
- Live competitive offers from authorized recyclers (GreenCycle @ ₹148, EcoMetals @ ₹152, Bharat Precious @ ₹144).

### 4. 📍 Live 10-Stage Journey Tracking & Leaflet Map
Interactive Leaflet route map and telematics timeline tracking the scrap lifecycle:
1. *Pickup Requested*
2. *Kabadiwala Assigned*
3. *Kabadiwala Arriving*
4. *Waste Collected & Weighed*
5. *In Transit to Aggregation Depot*
6. *Local Collection Centre*
7. *Sent to Recycler (Bulk Fleet)*
8. *Recycler Received (Weighbridge)*
9. *Recycling Verified (Assay Confirmation)*
10. *Environmental Contribution Calculated*
### 4. 🤝 AI Recycler Matching Engine
- Multi-criteria recommendation algorithm ranking authorized refiners based on price competitiveness, distance, minimum quantity, and CPCB authorization.
- Displays **Match Score %** (e.g. `96% Match`) with 1-click **"Accept & Handover"** action.

### 5. 🌱 Closed-Loop Recycler Verification & Green Cashback
- Environmental Contribution Points and User Cashback are awarded **only after the formal industrial recycler confirms verified weight receipt**.
- Users earn **Green Points** converted to **Green Cashback** funded by a dedicated **National Green Reward Fund** (sponsored via CSR partnerships: Tata Trusts, Unilever Clean Earth, Godrej CSR).
- Gamified Eco Levels: *Green Starter $\to$ Eco Collector $\to$ Recycling Champion $\to$ Sustainability Hero*.
### 5. 🤖 AI E-Waste Scanner (Modular Classifier Simulator)
- Computer vision classifier simulator with 1-click presets and file upload:
  - 🖥️ Motherboard PCB (96.4% confidence)
  - 🟩 Mixed Circuit Boards (94.2% confidence)
  - 🔌 Heavy Copper Cables (98.1% confidence)
  - 🔋 Li-Ion Battery Packs (95.7% confidence)
  - 📺 LCD Display Panels (93.8% confidence)
  - ⚙️ Copper-Wound Electric Motors (97.0% confidence)
  - 💻 Discarded Scrap Laptops (96.1% confidence)
- Feature tags and condition assessment.
- Clear transparency disclaimer: *AI DEMO PREDICTION: Photo-based computer vision analysis is strictly indicative for lot classification. Final commercial settlement is based entirely on actual weighbridge weight.*

### 6. 🌐 Multilingual Accessibility (i18n)
- Seamless instant language switching across **English**, **हिन्दी (Hindi)**, **தமிழ் (Tamil)**, and **मराठी (Marathi)**.
### 6. 📄 Digital Handover & Weight Mismatch Detection (`KC-HND-XXXXX`)
- Formal digital record connecting Collector and Recycler.
- **Weighbridge Inspection**:
  - Recycler measures actual weight on certified weighbridge.
  - Automated **Weight Mismatch Detection**: Discrepancies $>0.5\text{ kg}$ and variance $>3\%$ automatically trigger an **Anomaly Flag** in the regulatory audit log!
  - Once verified: status becomes **"✓ RECYCLING VERIFIED"**, authentic payment is recorded (Instant UPI), and formal environmental contribution points are awarded.

### 7. 🛡️ Trust, Privacy & Fraud Safeguards
- Generated unique identifiers: `KC-USR-XXXXX`, `KC-KAB-XXXXX`, `KC-PICK-XXXXX`, `KC-TXN-XXXXX`, `KC-DEL-XXXXX`.
- Masked ID verification (e.g. `XXXX-XXXX-8921` — never raw Aadhaar numbers).
- Digital receipt generation and 1–5 star rating system (Fair Weighing, Timeliness, Behaviour).
### 7. 📍 10-Stage E-Waste Journey & Telematics Map
Interactive Leaflet route map connecting the full journey:
1. *E-Waste Collected*
2. *Material Sorted & Depopulated*
3. *Digital Lot Created & Weighed*
4. *Price Discovered & Compared*
5. *Authorized Recycler Matched*
6. *Offer Accepted & Handover Scheduled*
7. *Consignment In Transit*
8. *Recycler Received at Gate*
9. *Weighbridge & Assay Verified*
10. *✓ Formal Recycling Verified*

---
### 8. 🛡️ AI Anomaly Detection & Regulatory Audit Log (Admin Portal)
- Monitors and flags:
  - **Price Outlier Anomalies** (transactions outside market reference bands)
  - **Weight Variance Discrepancies** ($>3\%$ drops at weighbridge)
  - **Duplicate & Suspicious Patterns**

## 💻 Tech Stack
### 9. 🏢 Secondary Sourcing Module (Give E-Waste)
- Local repair shops, IT offices, and households can post e-waste collection requests.
- Nearby informal collectors accept requests and convert them directly into official digital material lots.

- **Backend**: Python 3.14 + Flask 3.1.3 (RESTful API, modular architecture)
- **Database**: SQLite 3 (`kabadiwala.db`) with relational schema & pre-seeded SIH demo records
- **Frontend**: Single-Page Application (SPA) with Tailwind CSS, Lucide Icons, Leaflet.js, and Chart.js
- **Animations**: Custom CSS laser scanner effect, floating badges, and Canvas Confetti
- **Testing**: Python `unittest` suite (`test_app.py`) covering all 10 milestones
### 10. 🌐 Multi-Language (i18n) & Field Offline-Ready Mode
- Available in **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, and **தமிழ் (Tamil)**.
- High-contrast, large-button design suitable for field operators.
- Offline status indicator: *🟢 Field Offline Ready (Local Cache Active)*.

---

## ⚡ How to Run

### Option 1: 1-Click Startup (Windows)
### Option 1: 1-Click Windows Startup
Double-click:
```bat
run.bat
```
This starts the Flask server and opens `http://127.0.0.1:5000` in your default browser.
Starts Flask server and automatically opens `http://127.0.0.1:5000` in your browser.

### Option 2: Command Line
```powershell
# In the project directory:
python database.py   # Seeds/resets SIH demo data
python database.py   # Reseeds fresh SIH demo records
python app.py        # Starts Flask server on port 5000
```
Visit: **`http://127.0.0.1:5000`**

### Option 3: Run Automated Test Suite
```powershell
python test_app.py
```

---

## 🎯 Evaluator / Presentation Guide

A sticky **"SIH Demo Mode: Switch Persona"** bar is pinned at the top of every screen:
- **🌐 Home**: View landing page, 10-step visual flow, economic model, and live rates.
- **👤 User (Ramesh Kumar - `KC-USR-10001`)**: Explore the user dashboard, test the AI scanner, create a mixed waste pickup request, view active pickups, track journey on the map, view environmental savings (CO2, trees spared), and inspect digital receipts.
- **🚚 Kabadiwala (Santosh Bhai - `KC-KAB-20001`)**: View collection summary, accept incoming requests, open the **Weigh & Settle Payment** digital scale modal, inspect the **My Collected Waste** inventory, view commercial margin analytics, and dispatch bulk consignments.
- **🏭 Recycler / Admin**: Review pending consignments at the industrial recovery facility, click **Confirm Received ✓** to formally verify the recycling loop, edit dynamic scrap rates in real-time, and manage the Green Reward Fund.
- **🔄 Reset Demo Button**: Restores the pre-seeded demo state instantly.

*(All 10 milestone unit tests pass with `OK`).*
