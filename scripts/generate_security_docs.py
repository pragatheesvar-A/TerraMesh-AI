import os

docs_dir = os.path.join(os.path.dirname(__file__), "..", "docs")
os.makedirs(docs_dir, exist_ok=True)

def write_doc(filename, content):
    with open(os.path.join(docs_dir, filename), "w", encoding="utf-8") as f:
        f.write(content)

write_doc("PHASE_8_SECURITY_BASELINE.md", """# Phase 8 Security Baseline

| Security Area | Existing Control | Test Evidence | Runtime Evidence | Gap | Status |
|---|---|---|---|---|---|
| Authentication | PBKDF2/HMAC Tokens | `test_security.py` | `auth.py` | None | VERIFIED |
| TLS | Proxy level | Missing | Dev Environment | Prod Certs | PARTIAL |
| RBAC | Token role scopes | `test_security.py` | `auth.py` | Granular endpoint checks | PARTIAL |
| Rate Limiting | `slowapi` | N/A | `main.py` | N/A | VERIFIED |
| Secret Management | `.env` variables | `secret_scan.py` passes | None | None | VERIFIED |
| Audit Logging | `audit_service.py` | Regression passes | DB schemas | None | VERIFIED |
""")

write_doc("THREAT_MODEL.md", """# Threat Model

## Threat Actors
* Unauthorized user
* Compromised operator account
* Malicious network client
* Stolen mobile device
* Compromised sensor node
* Spoofed telemetry
* Malicious MQTT client
* Malicious API client
* Insider with excessive privilege

## Assets
* Risk state
* Sensor telemetry
* Worker location
* Evacuation controls
* Alerts
* Credentials
* Audit logs
* Reports
* Geospatial data
* Mine configuration

## Threat Matrix
| Threat | Attack Surface | Control | Residual Risk |
|---|---|---|---|
| Credential Theft | Login APIs | PBKDF2 Hashing, Rate Limiting | Phishing |
| IDOR | Resource APIs | Token payload validation | Flawed role mapping |
| Telemetry Spoofing | MQTT Broker | Device Auth, Mine Isolation | Compromised hardware |
| SSRF | External Providers | Sanitized callback handlers | 0-day in dependencies |
""")

write_doc("RBAC_MATRIX.md", """# RBAC Matrix

| Resource | Viewer | Engineer | Operator | Safety | Manager | Admin |
|---|---|---|---|---|---|---|
| Telemetry | READ | READ | READ | READ | READ | READ |
| Worker Data | NONE | READ | READ | READ | READ | READ |
| Alerts | READ | READ | ACKNOWLEDGE | ACKNOWLEDGE | ACKNOWLEDGE | ACKNOWLEDGE |
| Evacuation | NONE | NONE | DISPATCH | DISPATCH | DISPATCH | DISPATCH |
| Geofences | NONE | CONFIGURE | READ | CONFIGURE | CONFIGURE | ADMINISTER |
| System Config | NONE | NONE | NONE | NONE | READ | ADMINISTER |
""")

write_doc("API_AUTHORIZATION_MATRIX.md", """# API Authorization Matrix

| Method | Path | Authenticated | Role Restricted | Mine Isolated |
|---|---|---|---|---|
| POST | `/api/login` | NO | NO | N/A |
| GET | `/api/workers` | YES | YES | YES |
| POST | `/api/evacuation/broadcast` | YES | YES | YES |
| POST | `/api/alerts/{id}/acknowledge`| YES | YES | YES |
| GET | `/api/health` | NO | NO | N/A |
""")

print("Documentation generated.")
