# FINAL REMAINING GAPS — RC-1

## Software Gaps
| Gap | Impact | Resolution |
|---|---|---|
| Mobile device-runtime test | No physical APK test | Execute on physical Android device |
| Frontend E2E (Playwright) | No browser automation | Add Playwright suite post-RC1 |
| utcnow() deprecation warnings (29) | Future Python compat | Migrate to datetime.now(UTC) in RC-2 |

## Hardware Gaps
| Gap | Impact | Resolution |
|---|---|---|
| ESP32 / MCU absent | No real sensor readings | Procure hardware |
| LoRa modules absent | No RF range data | Procure hardware |
| Raspberry Pi gateway absent | No gateway execution | Procure hardware |
| Physical tilt/vibration sensors absent | No calibration data | Procure hardware |

## Credential Gaps
| Gap | Impact | Resolution |
|---|---|---|
| FCM credentials | Push notifications blocked | Obtain Firebase credentials |
| Twilio SMS credentials | SMS blocked | Obtain Twilio account |
| SMTP credentials | Email blocked | Configure production SMTP |
| Sentinel/NISAR API credentials | InSAR blocked | Obtain provider API access |

## Cloud Gaps
| Gap | Impact | Resolution |
|---|---|---|
| Azure not provisioned | No cloud runtime | Provision Azure resources per docs |
| CI/CD not runtime-executed | Authored only | Run GitHub Actions on push |

## Field Validation Gaps
| Gap | Impact | Resolution |
|---|---|---|
| No mine-site sensor data | Model not field-validated | Execute controlled bench test -> site pilot |
| No calibrated sensor evidence | Calibration unverified | Perform traceable calibration |
| No longitudinal data | Drift detection unverified | Collect multi-month field data |
| No real worker tracking hardware | Worker safety unverified physically | Deploy RTLS hardware |
