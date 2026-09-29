# RISK STATE DEFINITIONS

| State | Meaning | Inputs | Transition Condition | Operator Action | Notification Policy | Evacuation |
|---|---|---|---|---|---|---|
| SAFE | Nominal | Sensor | Base | Monitor | None | No |
| WARNING | Elevated | Sensor/AI | > Threshold | Observe | UI Alert | No |
| CRITICAL | Danger | Risk Engine | > Critical | Evacuate | FCM/SMS/Email | Yes (Manual Auth) |
