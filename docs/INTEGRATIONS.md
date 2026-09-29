# TerraMesh AI — External Integration & Credential Provisioning Guide

This is the honest bridge between LOCAL DEMONSTRATION READY and PRODUCTION
VALIDATED: every `BLOCKED` integration below is code-complete and becomes
live the moment its credentials are provisioned. `scripts/verify_integrations.py`
reports the real state of each at any time.

---

## 1. FCM push notifications (mobile worker/supervisor alerts)

**Blocked because:** no Firebase project credentials exist.

Provisioning:
1. Create a Firebase project → add an Android app + iOS app.
2. Project settings → Service accounts → *Generate new private key* → JSON.
3. Place the file (never commit; `.gitignore` already excludes
   `firebase-credentials.json`) and set:
   ```
   FIREBASE_CREDENTIALS_PATH=/etc/terramesh/firebase-credentials.json
   ```
4. The mobile/web app registers device tokens via
   `POST /api/notifications/register-token` (authenticated).
5. Verify: `python scripts/verify_integrations.py` → `fcm: CONFIGURED`.

## 2. SMS gateway (L2/L3 alerts)

**Blocked because:** no gateway credentials.

Choose one:
- **SMSGate-compatible LAN gateway** — set `SMS_GATEWAY_URL`,
  `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASS`.
- **Fast2SMS** — set `FAST2SMS_API_KEY`.

Without either, dispatches are labelled `SIMULATED DISPATCH` and never sent.
The old demo gateway credential was purged from the repo (CI guards it).

## 3. Email alerts (L2/L3)

**Blocked because:** no SMTP credentials.

Set: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`,
`SMTP_FROM`, `SMTP_USE_TLS`, and `ALERT_EMAIL_TO` (comma-separated ops
mailbox). The multi-channel dispatcher (`dispatch_alert_channels` in
`backend/main.py`) sends for WARNING/CRITICAL/EVACUATE severities.

## 4. Live satellite data (InSAR — Sentinel-1 / NISAR)

**Blocked because:** no provider credentials AND no interferogram
processing stack.

Two separate requirements:
1. **Credentials:** register at Copernicus Data Space
   (dataspace.copernicus.eu) → set `COP_USER`, `COP_PASSWORD`,
   `INSAR_PROVIDER=sentinel`.
2. **Processing:** producing a deformation grid from SLC pairs needs a
   processing stack (SNAP or ISCE) — scene download + coregistration +
   unwrapping + geocoding. That stack is NOT part of this repository;
   `SentinelProvider.fetch_interferogram` raises BLOCKED rather than
   fabricating an observation. A production deployment adds a processing
   service that writes grids (e.g. into object storage) and extends the
   provider to read them.

NISAR: mission data portal integration is future work by design.

## 5. MQTT TLS + broker authentication

Dev broker is anonymous + loopback-bound. Production:
- `infra/mosquitto/mosquitto.conf.production` + `acl_file` — create the
  password file: `mosquitto_passwd -c -b /mosquitto/config/passwd
  terramesh-backend '<password>'`.
- Backend: `MQTT_USERNAME`/`MQTT_PASSWORD`/`MQTT_USE_TLS=true` +
  `MQTT_CA_CERT`.

## 6. On-site siren / beacon hardware

The backend emits `siren_active`/`siren_suppressed` in every decision; the
Raspberry-Pi gateway application drives a physical relay via
`SIREN_RELAY_PIN` (see `edge/gateway/install.md` §Operation). Provisioning =
relay board + GPIO wiring on the gateway; no backend change needed.

## 7. Azure deployment

`infra/azure/main.bicep` (AUTHORED, never deployed — no subscription).
When provisioning:
```
az group create --name rg-terramesh --location centralindia
az bicep build -f infra/azure/main.bicep     # syntax validation
az deployment group create -f infra/azure/main.bicep -g rg-terramesh \
  -p postgresPassword='<strong>' secretKey='<openssl-rand-hex-32>'
```
Build/push the backend+frontend images first
(`docker compose build` + push to your registry), then update the image
names in the Bicep parameters. Note: Azure managed PostgreSQL does NOT
include TimescaleDB — the template runs the `timescaledb-ha:pg16`
container; for production scale prefer Timescale Cloud.

## 8. Web Push (PWA push notifications)

The dashboard is an installable PWA (`manifest.webmanifest` + `sw.js`).
Push requires VAPID keys + the FCM web cert — provision together with
item 1 and extend `sw.js` with a `push` event handler. Documented as the
final step of the FCM provisioning.

---

## Verification

```powershell
cd apps/mineguard-core/backend
python ../../scripts/verify_integrations.py
```

Every integration reports `CONFIGURED` or `BLOCKED` honestly, with the
exact env vars still missing.
