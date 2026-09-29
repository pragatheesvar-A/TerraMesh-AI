# Raspberry-Pi Gateway — Provisioning Guide

**STATUS: deployment-ready software, never executed on hardware in this
project.** These are the exact provisioning steps for the real gateway.

## Hardware bill (per the deck / hardware report)

- Raspberry Pi 4 (or industrial PC equivalent) + 4G/Wi-Fi backhaul
- ESP32-S3/SX1262 LoRa receiver board presenting the mesh downlink as a
  serial stream (`<topic>|<json>` frames — see the firmware contract)
- Optional: relay board on a free GPIO for the on-site siren/beacon

## Install (Raspberry Pi OS / Debian)

```bash
# 1. System user + layout
sudo useradd -r -m terramesh
sudo mkdir -p /opt/terramesh /etc/terramesh
sudo chown -R terramesh:terramesh /opt/terramesh

# 2. Copy the app (from this repository)
sudo cp -r edge/gateway /opt/terramesh/edge/gateway

# 3. Python env + dependencies
sudo apt install -y python3-venv python3-serial
sudo python3 -m venv /opt/terramesh/venv
sudo /opt/terramesh/venv/bin/pip install "paho-mqtt>=2.0" "redis>=5.0"
# pyserial is provided by python3-serial on Debian; otherwise:
#   sudo /opt/terramesh/venv/bin/pip install pyserial

# 4. Secrets (NEVER commit)
sudo tee /etc/terramesh/gateway.env >/dev/null <<'EOF'
MQTT_USERNAME=terramesh-gateway
MQTT_PASSWORD=<strong-password>
MQTT_CA_CERT=/etc/terramesh/broker-ca.crt
MINE_ID=jharia_01
SIREN_RELAY_PIN=17
EOF
sudo chmod 600 /etc/terramesh/gateway.env

# 5. Service
sudo cp /opt/terramesh/edge/gateway/terramesh-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now terramesh-gateway
journalctl -u terramesh-gateway -f
```

## Operation

- Offline-first: if the broker is unreachable, packets buffer in the local
  SQLite WAL (`gateway_live_buffer.db`) and replay with ORIGINAL timestamps
  plus `_replayed_from_buffer` on reconnect.
- The NTP beacon for mesh nodes: run `timedatectl set-ntp true` and allow
  UDP/123 from the mesh VLAN; the firmware points at the gateway for time.
- TLS is ON by default (`MQTT_USE_TLS=true`, port 8883). Broker-side ACL
  template: `infra/mosquitto/acl_file`.
