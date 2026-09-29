# Threat Model

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
