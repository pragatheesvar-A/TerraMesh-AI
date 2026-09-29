# TerraMesh AI — Hardware Integration Checklist

> **STATUS: FUTURE PROCEDURE — no physical hardware exists in this project.**
> This checklist is executed at the mine site before Phase V2 of the field
> validation plan.

## Nodes (per unit)

- [ ] Firmware flashed (`pio run -t upload` from `edge/firmware/terramesh_node/`)
- [ ] `NODE_ID` + `MINE_ID` set and unique across the fleet
- [ ] Sensors calibrated per docs/SENSOR_CALIBRATION_PLAN.md (records kept)
- [ ] Solar panel oriented + LiFePO4 pack sized for site insolation
- [ ] IP-rated enclosure sealed; cable glands torqued
- [ ] Node booted on-bench: serial console shows sensor reads + LoRa join
- [ ] LittleFS offline queue verified (pull antenna mid-test; confirm buffering
      then replay with `_replayed_from_buffer: true`)
- [ ] Timestamp sanity: NTP beacon received from the gateway (no `UNSYNCED+` markers in packets)

## Gateway (per unit)

- [ ] Raspberry-Pi provisioned per `edge/gateway/install.md`
- [ ] LoRa receiver serial frame rate stable at the target baud
- [ ] MQTT uplink over TLS verified against the production broker
      (`mosquitto_sub -h <broker> -p 8888 --cafile <ca> -t 'mines/#' -v`)
- [ ] Store-and-forward verified: disconnect the uplink for ≥ 10 min, confirm
      replay ordering + original timestamps on restore
- [ ] Siren relay GPIO toggled by a test `siren_active` decision (relay clicks)
- [ ] systemd unit enabled; reboot test passes (service auto-starts)

## Backend / broker

- [ ] Broker authentication on (password file + ACL per `infra/mosquitto/`)
- [ ] TLS enabled both legs (broker ← → backend; MQTT_USE_TLS=true)
- [ ] `SECRET_KEY` is a generated 32-byte hex (the production guard refuses defaults)
- [ ] Users table provisioned (PBKDF2) — demo passwords auto-disabled in production
- [ ] `scripts/verify_integrations.py` reports the intended channel states
- [ ] Audit trail receiving rows (do one login + one calibration; check `/api/audit`)

## RF / mesh

- [ ] Link budget per hop measured (RSSI/SNR margins above the −120 dBm floor)
- [ ] Hop count tuned per the deck's site-geometry guidance
- [ ] Packet delivery ≥ 95% over a 24 h soak BEFORE Phase V1 begins
