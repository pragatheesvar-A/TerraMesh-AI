import logging
import random
import time
from datetime import datetime
import joblib
import os
import pandas as pd
import numpy as np

class MineSimulationEngine:
    def __init__(self):
        self.demo_mode = False
        self.demo_step = 0
        self.current_risk_score = 87
        self.risk_trend = 18
        self.prediction = "Deformation is increasing in Zone B."
        self.route_a_status = "BLOCKED"
        self.route_b_status = "SAFE"
        self.zone_b_status = "CRITICAL"
        self.workers_at_risk = 7

        # Honest system-status probing state (see _live_system_status)
        self._sys_status_cache = None
        self._last_sync_ts = time.time()

        # 48 Sensor nodes
        self.sensors = self._init_sensors()
        # 126 Workers
        self.workers = self._init_workers()
        # Active alerts
        self.alerts = self._init_alerts()

        # Load the lightweight synthetic-regressor demo model (from train_model.py).
        # NOTE: this is NOT the production 5-class classifier (backend/models/);
        # it powers the demo dataset's headline score only. See _predict_real_risk.
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
            self.ml_model = joblib.load(model_path)
            self.model_loaded = True
        except Exception as e:
            logging.getLogger("terramesh.simulation").warning(
                "Demo regressor model not loaded from %s — demo risk uses the scripted fallback. %s",
                model_path, e)
            self.ml_model = None
            self.model_loaded = False

    def _init_sensors(self):
        sensors = []
        base_lat = 23.7745  # Jharia Coalfield Region
        base_lng = 86.4120
        
        for i in range(1, 49):
            s_id = f"NODE-{i:03d}"
            zone = "Zone B" if i in [15, 16, 17, 18, 19, 20, 21, 22] else ("Zone A" if i <= 14 else ("Zone C" if i <= 34 else "Zone D"))
            
            # NODE-017 has specific critical metrics from user requirements
            if i == 17:
                sensors.append({
                    "id": "NODE-017",
                    "name": "Geotech Pillar 17-B",
                    "zone": "Zone B",
                    "lat": base_lat + 0.0042,
                    "lng": base_lng + 0.0035,
                    "tilt": 4.8,
                    "displacement": 12.4,
                    "crack_width": 7.2,
                    "vibration": "HIGH",
                    "battery": 84,
                    "lora_signal": 92,
                    "ai_risk_score": 87,
                    "status": "CRITICAL",
                    "last_update": "Just now"
                })
            elif i == 48:
                # 1 offline sensor
                sensors.append({
                    "id": f"NODE-{i:03d}",
                    "name": f"Pillar {i}",
                    "zone": zone,
                    "lat": base_lat + ((i % 7) - 3) * 0.0025,
                    "lng": base_lng + ((i // 7) - 3) * 0.0025,
                    "tilt": 0.2,
                    "displacement": 0.4,
                    "crack_width": 0.1,
                    "vibration": "LOW",
                    "battery": 0,
                    "lora_signal": 0,
                    "ai_risk_score": 5,
                    "status": "OFFLINE",
                    "last_update": "42 mins ago"
                })
            elif i in [16, 18, 23]:
                # Warning / Caution sensors
                sensors.append({
                    "id": f"NODE-{i:03d}",
                    "name": f"Pillar {i}",
                    "zone": zone,
                    "lat": base_lat + ((i % 7) - 3) * 0.0025,
                    "lng": base_lng + ((i // 7) - 3) * 0.0025,
                    "tilt": 2.9 if i == 16 else 1.8,
                    "displacement": 7.8 if i == 16 else 4.2,
                    "crack_width": 3.9 if i == 16 else 2.1,
                    "vibration": "HIGH" if i == 23 else "MEDIUM",
                    "battery": 88,
                    "lora_signal": 90,
                    "ai_risk_score": 68 if i == 16 else 52,
                    "status": "WARNING" if i == 16 else "CAUTION",
                    "last_update": "2 mins ago"
                })
            else:
                # Safe sensors
                sensors.append({
                    "id": f"NODE-{i:03d}",
                    "name": f"Pillar {i}",
                    "zone": zone,
                    "lat": base_lat + ((i % 7) - 3) * 0.0025 + random.uniform(-0.0004, 0.0004),
                    "lng": base_lng + ((i // 7) - 3) * 0.0025 + random.uniform(-0.0004, 0.0004),
                    "tilt": round(random.uniform(0.1, 0.9), 1),
                    "displacement": round(random.uniform(0.2, 1.8), 1),
                    "crack_width": round(random.uniform(0.0, 0.8), 1),
                    "vibration": "LOW",
                    "battery": random.randint(82, 99),
                    "lora_signal": random.randint(88, 99),
                    "ai_risk_score": random.randint(8, 24),
                    "status": "SAFE",
                    "last_update": "1 min ago"
                })
        return sensors

    def _init_workers(self):
        workers = []
        base_lat = 23.7745
        base_lng = 86.4120

        # 126 authentic Indian coal miner names (Jharia / Dhanbad region)
        NAME_POOL = [
            "Rajesh Kumar",       "Amit Sen",           "Bikram Soren",       "Dharmendra Singh",
            "Suresh Mahto",       "Prakash Yadav",      "Manoj Tiwari",       "Ranjit Pandey",
            "Gopal Das",          "Santosh Gupta",      "Dilip Sharma",       "Rakesh Oraon",
            "Vijay Munda",        "Anil Hembrom",       "Sanjay Mahali",      "Deepak Kisku",
            "Ramesh Tudu",        "Prabhat Murmu",      "Naresh Hansda",      "Binod Baskey",
            "Sunil Lohra",        "Tapan Gope",         "Biren Ghosh",        "Somnath Roy",
            "Kartik Dey",         "Mrinal Mondal",      "Subhash Bhatt",      "Girish Pal",
            "Ashok Rajwar",       "Hemant Nayak",       "Sushil Meher",       "Ganesh Kharia",
            "Rabindra Majhi",     "Uttam Banra",        "Chandan Bauri",      "Kamal Sundi",
            "Nand Lal Sahu",      "Biswajit Das",       "Pradip Chakraborty", "Tarun Ghosh",
            "Amit Karmakar",      "Raju Mondal",        "Nikhil Gorai",       "Subir Bouri",
            "Pranab Mitra",       "Debashis Sen",       "Palash Datta",       "Sourav Halder",
            "Mithun Paramanik",   "Samir Biswas",       "Prashant Kotal",     "Arun Besra",
            "Nirmal Sardar",      "Swapan Mondal",      "Chanchal Bagdi",     "Joydev Ruidas",
            "Tapas Samanta",      "Dilip Patra",        "Sanat Chattopadhyay","Bipin Koley",
            "Raghunath Pal",      "Shyamal Bera",       "Haren Mudi",         "Mohan Mahata",
            "Bablu Chowdhury",    "Dipak Bandyopadhyay","Subodh Koner",       "Asim Ghosh",
            "Kartik Malik",       "Bimal Khamrui",      "Goutam Dutta",       "Pijush Das",
            "Uttam Panda",        "Arindam Chandra",    "Ratan Kundu",        "Kaushik Roy",
            "Sukumar Giri",       "Biswarup Jana",      "Indrajit Bose",      "Partha Banerjee",
            "Shibu Mukherjee",    "Tarak Sil",          "Netai Ghosh",        "Sudip Adhikari",
            "Bikash Dinda",       "Samiran Chatterjee", "Anup Laha",          "Rana Mukhopadhyay",
            "Anand Haldar",       "Badal Karan",        "Nilu Manna",         "Tapan Bagdi",
            "Debu Samanta",       "Khokon Bain",        "Subal Saha",         "Madan Dhara",
            "Chittaranjan Das",   "Benoy Gayen",        "Paresh Maity",       "Biswanath Rana",
            "Narayan Mondal",     "Ranjit Rishi",       "Subhendu Mitra",     "Parthasarathi Bose",
            "Sujit Ghosh",        "Tanmoy Sarkar",      "Basudeb Chatterjee", "Sudipta Pal",
            "Arjun Hembram",      "Dinesh Gope",        "Suresh Munda",       "Ratan Soren",
            "Khirod Tudu",        "Babul Kisku",        "Laxman Hansda",      "Niranjan Murmu",
            "Sushanta Baskey",    "Bipin Lohra",        "Dilip Majhi",        "Tapas Banra",
            "Pradyot Sinha",      "Kartick Mondal",     "Dulal Pal",          "Nripen Das",
            "Kalyan Gorai",       "Sujoy Bose",         "Joydeb Maiti",       "Tapan Dhara",
        ]

        # Specific key workers (fixed)
        key_workers = {
            1:  ("W-001", "Rajesh Kumar",    "Zone A", "SAFE",    72,  99, 85),
            23: ("W-023", "Amit Sen",        "Zone B", "DANGER", 112, 94, 140),
            41: ("W-041", "Bikram Soren",    "Zone B", "DANGER", 108, 95, 142),
            52: ("W-052", "Dharmendra Singh","Zone C", "CAUTION", 86, 97, 110),
        }

        # Danger workers in Zone B (7 total)
        danger_indices = [23, 41, 15, 34, 45, 62, 77]
        # Caution workers (10 total)
        caution_indices = [52, 12, 28, 39, 66, 81, 93, 104, 115, 120]

        for i in range(1, 127):
            w_code = f"W-{i:03d}"
            worker_name = NAME_POOL[(i - 1) % len(NAME_POOL)]
            if i in key_workers:
                code, name, zone, status, hr, spo2, depth = key_workers[i]
                workers.append({
                    "id": f"w-{i}",
                    "code": code,
                    "name": name,
                    "zone": zone,
                    "lat": base_lat + (0.004 if zone == "Zone B" else (0.001 if zone == "Zone A" else -0.003)) + random.uniform(-0.0006, 0.0006),
                    "lng": base_lng + (0.003 if zone == "Zone B" else (-0.002 if zone == "Zone A" else 0.002)) + random.uniform(-0.0006, 0.0006),
                    "status": status,
                    "heart_rate": hr,
                    "spo2": spo2,
                    "depth_m": depth,
                    "last_update": "Just now"
                })
            elif i in danger_indices:
                workers.append({
                    "id": f"w-{i}",
                    "code": w_code,
                    "name": worker_name,
                    "zone": "Zone B",
                    "lat": base_lat + 0.0038 + random.uniform(-0.0007, 0.0007),
                    "lng": base_lng + 0.0032 + random.uniform(-0.0007, 0.0007),
                    "status": "DANGER",
                    "heart_rate": random.randint(102, 118),
                    "spo2": random.randint(93, 96),
                    "depth_m": random.randint(135, 150),
                    "last_update": "Just now"
                })
            elif i in caution_indices:
                workers.append({
                    "id": f"w-{i}",
                    "code": w_code,
                    "name": worker_name,
                    "zone": "Zone C",
                    "lat": base_lat - 0.0025 + random.uniform(-0.0008, 0.0008),
                    "lng": base_lng + 0.0015 + random.uniform(-0.0008, 0.0008),
                    "status": "CAUTION",
                    "heart_rate": random.randint(82, 92),
                    "spo2": random.randint(96, 98),
                    "depth_m": random.randint(100, 125),
                    "last_update": "3 mins ago"
                })
            else:
                zone = "Zone A" if i <= 50 else ("Zone C" if i <= 90 else "Zone D")
                workers.append({
                    "id": f"w-{i}",
                    "code": w_code,
                    "name": worker_name,
                    "zone": zone,
                    "lat": base_lat + (0.001 if zone == "Zone A" else -0.003) + random.uniform(-0.0012, 0.0012),
                    "lng": base_lng + (-0.002 if zone == "Zone A" else 0.003) + random.uniform(-0.0012, 0.0012),
                    "status": "SAFE",
                    "heart_rate": random.randint(68, 80),
                    "spo2": random.randint(97, 99),
                    "depth_m": random.randint(80, 120),
                    "last_update": "1 min ago"
                })
        return workers

    def _init_alerts(self):
        return [
            {
                "id": "ALT-1092",
                "severity": "CRITICAL",
                "title": "Zone B deformation increasing",
                "description": "Accelerated vertical displacement detected across Pillar 17-B cluster. Rate exceeds threshold: 3.4mm/hr.",
                "zone": "Zone B",
                "timestamp": "10:42:18 AM",
                "acknowledged": False
            },
            {
                "id": "ALT-1091",
                "severity": "WARNING",
                "title": "Node-017 crack widening detected",
                "description": "Geotagged fissure gauge 7.2mm (+1.8mm in 15 mins). Risk of roof spalling.",
                "zone": "Zone B",
                "timestamp": "10:40:02 AM",
                "acknowledged": False
            },
            {
                "id": "ALT-1090",
                "severity": "CAUTION",
                "title": "Node-023 vibration anomaly",
                "description": "Micro-seismic acoustic emission pulse detected. Possible geological fault settlement.",
                "zone": "Zone C",
                "timestamp": "10:38:41 AM",
                "acknowledged": True
            },
            {
                "id": "ALT-1089",
                "severity": "WARNING",
                "title": "Route A structural compression",
                "description": "Secondary timber roof beam stress sensor reached 88% capacity. Dynamic reroute recommended.",
                "zone": "Tunnel Shaft A-2",
                "timestamp": "10:31:14 AM",
                "acknowledged": True
            }
        ]

    def _predict_real_risk(self, tilt, displacement, crack, vibration_str):
        """Demo-path risk score. Uses the lightweight synthetic regressor
        (train_model.py); falls back to the scripted 87 when unavailable.
        This is the DEMO data plane only — the live pipeline uses the real
        5-class classifier + Unified Risk Engine."""
        if not getattr(self, 'model_loaded', False) or self.ml_model is None:
            return 87

        try:
            # Map qualitative vibration to quantitative for the model
            vib_map = {"LOW": 1.5, "MEDIUM": 3.0, "HIGH": 5.0}
            vib_val = vib_map.get(vibration_str, 1.5)

            # historical_trend is kept constant at 0.8 for the critical zone
            input_data = pd.DataFrame([{
                'tilt_change': tilt,
                'displacement_rate': displacement,
                'crack_widening': crack,
                'vibration': vib_val,
                'historical_trend': 0.8
            }])

            pred = self.ml_model.predict(input_data)[0]
            return max(0, min(100, int(pred)))
        except Exception as e:
            logging.getLogger("terramesh.simulation").warning("Demo risk prediction failed: %s", e)
            return 87

    def get_overview(self):
        # Calculate real risk using the ML model based on NODE-017 (the critical node)
        target_node = next((s for s in self.sensors if s["id"] == "NODE-017"), None)
        if target_node and self.model_loaded:
            real_risk = self._predict_real_risk(
                target_node["tilt"], 
                target_node["displacement"], 
                target_node["crack_width"], 
                target_node["vibration"]
            )
            self.current_risk_score = real_risk
            
            # Dynamically set risk level
            if self.current_risk_score >= 75: self.prediction = "EMERGENCY: Ground movement exceeded critical threshold."
            elif self.current_risk_score >= 50: self.prediction = "WARNING: Accelerated ground movement detected."
            elif self.current_risk_score >= 25: self.prediction = "WATCH: Minor ground movement detected."
            else: self.prediction = "All mining panels operating within nominal baseline parameters."
            
            # Dynamic factors (dummy percentages that sum to 100 based on magnitude)
            vib_map = {"LOW": 1.5, "MEDIUM": 3.0, "HIGH": 5.0}
            vib_val = vib_map.get(target_node["vibration"], 1.5)
            
            raw_weights = {
                "tilt_change": target_node["tilt"] * 35,
                "displacement_rate": (target_node["displacement"] / 5.0) * 30,
                "crack_widening": target_node["crack_width"] * 20,
                "vibration": vib_val * 10,
                "historical_trend": 0.8 * 5
            }
            total_weight = sum(raw_weights.values()) or 1
            factors = {k: int((v / total_weight) * 100) for k, v in raw_weights.items()}
        else:
            factors = {
                "tilt_change": 32,
                "displacement_rate": 27,
                "crack_widening": 18,
                "vibration": 10,
                "historical_trend": 13
            }

        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "kpis": {
                "overall_risk": self.current_risk_score,
                "active_sensors_online": 47,
                "active_sensors_offline": 1,
                "active_sensors_total": 48,
                "monitored_workers_total": 126,
                "monitored_workers_safe": 119 if self.demo_step == 0 else (126 - self.workers_at_risk),
                "monitored_workers_risk": self.workers_at_risk,
                "safe_zones_count": 38,
                "safe_zones_status": "Stable",
                "warning_zones_count": 7,
                "warning_zones_delta": "+2 from previous hour",
                "critical_zones_count": 3 if not self.demo_mode else (1 if self.demo_step > 5 else 0),
                "critical_zones_status": "Immediate attention required"
            },
            "risk_intelligence": {
                "current_risk_score": self.current_risk_score,
                "risk_level": "CRITICAL" if self.current_risk_score >= 75 else ("WARNING" if self.current_risk_score >= 50 else ("CAUTION" if self.current_risk_score >= 25 else "SAFE")),
                "trend_percentage": self.risk_trend,
                "prediction": self.prediction,
                "factors": factors,
                "ai_confidence": 91,
                "provenance": "SIMULATION" if not self.model_loaded else "MODEL OUTPUT (demo regressor)",
                "disclaimer": "DEMO DATASET: this overview is driven by the simulation engine "
                              "(scripted scenario data). Live sensor telemetry flows through the "
                              "real ingestion pipeline and is labelled MEASURED."
            },
            "sensor_health": {
                "categories": [
                    {"name": "Tilt Sensors", "online": 48, "total": 48, "status": "OPTIMAL"},
                    {"name": "Displacement", "online": 47, "total": 48, "status": "DEGRADED"},
                    {"name": "Crack Sensors", "online": 45, "total": 48, "status": "ATTENTION"},
                    {"name": "Vibration", "online": 48, "total": 48, "status": "OPTIMAL"}
                ],
                "lora_network_pct": 98,
                "gateway_status": "ONLINE",
                "battery_health_pct": 92
            },
            "evacuation": {
                "target_zone": "Zone B",
                "zone_status": self.zone_b_status,
                "route_a_status": self.route_a_status,
                "route_b_status": self.route_b_status,
                "workers_at_risk": self.workers_at_risk,
                # Honest personnel provenance: the roster/positions come from
                # the demo simulator. Future RFID/RTLS/UWB hardware feeds flow
                # through /api/workers/location and appear here as MEASURED.
                "personnel_location_source": "SIMULATOR",
                "personnel_provenance": "SIMULATION",
                "recommended_action": "EVACUATE THROUGH ROUTE B" if self.route_b_status == "SAFE" else "HOLD IN REFUGE BAY 4",
                "routes": [
                    {
                        "route_id": "route-a",
                        "name": "Route A (Central Incline Shaft)",
                        "status": self.route_a_status,
                        "color": "#ef4444" if self.route_a_status == "BLOCKED" else "#10b981",
                        "waypoints": [
                            [23.7745 + 0.0042, 86.4120 + 0.0035],
                            [23.7745 + 0.0030, 86.4120 + 0.0020],
                            [23.7745 + 0.0018, 86.4120 + 0.0010],
                            [23.7745 + 0.0005, 86.4120 + 0.0002]
                        ]
                    },
                    {
                        "route_id": "route-b",
                        "name": "Route B (East Airway Drift)",
                        "status": self.route_b_status,
                        "color": "#10b981",
                        "waypoints": [
                            [23.7745 + 0.0042, 86.4120 + 0.0035],
                            [23.7745 + 0.0048, 86.4120 + 0.0055],
                            [23.7745 + 0.0035, 86.4120 + 0.0070],
                            [23.7745 + 0.0015, 86.4120 + 0.0080],
                            [23.7745 - 0.0010, 86.4120 + 0.0065]
                        ]
                    }
                ],
                "flow_steps": [
                    {"step": 1, "title": "Worker In Danger", "detail": "7 workers located in Zone B"},
                    {"step": 2, "title": "Danger Zone", "detail": "Subsidence velocity > 3.4 mm/h"},
                    {"step": 3, "title": "Route A Blocked", "detail": "Structural roof collapse at Pillar 12"},
                    {"step": 4, "title": "AI Rerouting", "detail": "Fastest clearance via East Drift (4.2 min)"},
                    {"step": 5, "title": "Route B Active", "detail": "Automated ventilation fan reversed"},
                    {"step": 6, "title": "Safe Zone", "detail": "Surface Assembly Area 3 secured"}
                ]
            },
            "infrastructure": {
                "roads_at_risk": 2,
                "buildings_at_risk": 12,
                "agricultural_areas": 4,
                "forest_areas": 1,
                "items": [
                    {"id": "INF-01", "category": "Road", "name": "NH-32 Coal Haul Expressway", "distance_m": 35, "risk_level": "HIGH", "details": "Active surface tensile stress fracture intersecting pavement"},
                    {"id": "INF-02", "category": "Building", "name": "Pithead Substation 33kV", "distance_m": 72, "risk_level": "MEDIUM", "details": "Foundation strain within 68% permissible tolerance"},
                    {"id": "INF-03", "category": "Agriculture", "name": "Paddy Cultivation Terrace B", "distance_m": 50, "risk_level": "HIGH", "details": "Trough subsidence depression collecting ground runoff"},
                    {"id": "INF-04", "category": "Forest", "name": "Sal Reserved Forest Buffer", "distance_m": 120, "risk_level": "LOW", "details": "Minor ground fissuring; no canopy displacement"}
                ]
            },
            "system_status": self._live_system_status()
        }

    def _live_system_status(self) -> dict:
        """Honest subsystem states probed at call time (5s TTL cache so the
        hot overview path stays cheap). Previously this block always claimed
        every subsystem ONLINE with a fixed uptime — false telemetry."""
        now = time.time()
        if self._sys_status_cache and (now - self._sys_status_cache[0]) < 5.0:
            cached = dict(self._sys_status_cache[1])
            cached["last_data_sync"] = f"{int(now - self._last_sync_ts)} seconds ago"
            return cached

        # Database (real probe)
        try:
            import database as _db
            db_health = _db.check_database_health()
            database_state = "ONLINE" if db_health.get("status") == "healthy" else "OFFLINE"
        except Exception:
            database_state = "UNKNOWN"

        # Redis / MQTT (real states, no probes needed)
        try:
            from cache.redis_client import redis_cache as _rc
            redis_state = "ONLINE" if _rc.is_available else (
                "OFFLINE" if _rc.status == "disabled" else "DEGRADED")
        except Exception:
            redis_state = "UNKNOWN"
        try:
            from mqtt.mqtt_client import mqtt_ingest as _mi
            mqtt_state = _mi.state  # ONLINE/DEGRADED/OFFLINE/RECOVERING
        except Exception:
            mqtt_state = "UNKNOWN"
        try:
            from ml_service import ml_service as _ml
            ai_state = "ONLINE" if _ml.is_loaded else "DEGRADED (no model artifacts)"
        except Exception:
            ai_state = "UNKNOWN"

        result = {
            "backend_api": "ONLINE",  # this process is answering, tautologically
            "ai_engine": ai_state,
            "database": database_state,
            "lora_gateway": mqtt_state,   # the LoRa/MQTT ingestion path
            "gis_service": "ONLINE",      # in-process spatial helpers
            "redis": redis_state,
            "last_data_sync": f"{int(now - self._last_sync_ts)} seconds ago",
            "system_uptime": 99.8  # demo dataset figure; operational uptime via /health
        }
        self._sys_status_cache = (now, result)
        return dict(result)

    def set_demo_step(self, step: int):
        self.demo_step = step
        self.demo_mode = step > 0

        if step == 0:
            # Normal State (0-0.2° Tilt, 0-2 mm/day Disp, 0-1 mm Crack, 0-2 mm/s Vibration)
            self.current_risk_score = 12
            self.risk_trend = 0
            self.prediction = "All mining panels operating within nominal baseline parameters."
            self.zone_b_status = "SAFE"
            self.route_a_status = "SAFE"
            self.route_b_status = "SAFE"
            self.workers_at_risk = 0
            for s in self.sensors:
                if s["status"] != "OFFLINE":
                    s["status"] = "NORMAL"
                    s["tilt"] = 0.15
                    s["displacement"] = 0.8
                    s["crack_width"] = 0.2
                    s["vibration"] = "LOW"
                    s["ai_risk_score"] = 12
            for w in self.workers:
                w["status"] = "SAFE"

        elif step == 1:
            # Safe State (0.2–0.5° Tilt, 2–5 mm/day Disp, 1–3 mm Crack, 2–5 mm/s Vibration)
            self.current_risk_score = 28
            self.risk_trend = 4
            self.prediction = "Sensor Node-017 registering minor safe drift (+0.35° tilt, 3.2 mm/day disp)."
            self.zone_b_status = "SAFE"
            for s in self.sensors:
                if s["id"] == "NODE-017":
                    s["tilt"] = 0.35
                    s["displacement"] = 3.2
                    s["crack_width"] = 1.8
                    s["status"] = "SAFE"
                    s["ai_risk_score"] = 28

        elif step == 2:
            # Warning State (0.5–1.0° Tilt, 5–20 mm/day Disp, 3–10 mm Crack, 5–10 mm/s Vibration)
            self.current_risk_score = 58
            self.risk_trend = 12
            self.prediction = "Extensometer detects continuous bed separation: 8.6 mm/day (Warning level)."
            self.zone_b_status = "WARNING"
            for s in self.sensors:
                if s["id"] == "NODE-017":
                    s["tilt"] = 0.75
                    s["displacement"] = 8.6
                    s["crack_width"] = 4.8
                    s["vibration"] = "HIGH"
                    s["status"] = "WARNING"
                    s["ai_risk_score"] = 58

        elif step == 3:
            # Elevated Warning
            self.current_risk_score = 69
            self.risk_trend = 15
            self.prediction = "Crack gauge indicates widening to 6.8mm (Warning: 3–10mm band)."
            self.zone_b_status = "WARNING"
            for s in self.sensors:
                if s["id"] == "NODE-017":
                    s["tilt"] = 0.92
                    s["displacement"] = 14.5
                    s["crack_width"] = 6.8
                    s["vibration"] = "HIGH"
                    s["status"] = "WARNING"
                    s["ai_risk_score"] = 69

        elif step >= 4:
            # Emergency / Critical State (>1.0° Tilt, >20 mm/day Disp, >10 mm Crack, >10 mm/s Vibration)
            self.current_risk_score = 87
            self.risk_trend = 18
            self.prediction = "EMERGENCY: Imminent crown pillar shearing predicted in Zone B (Tilt 4.8°, Sag 24.6 mm/day)."
            self.zone_b_status = "CRITICAL"
            self.route_a_status = "BLOCKED"
            self.route_b_status = "SAFE"
            self.workers_at_risk = 7
            for s in self.sensors:
                if s["id"] == "NODE-017":
                    s["tilt"] = 4.8
                    s["displacement"] = 24.6
                    s["crack_width"] = 12.4
                    s["vibration"] = "HIGH"
                    s["status"] = "CRITICAL"
                    s["ai_risk_score"] = 87
            for w in self.workers:
                if w["id"] in ["w-23", "w-41", "w-15", "w-34", "w-45", "w-62", "w-77"]:
                    w["status"] = "DANGER"

sim_engine = MineSimulationEngine()
