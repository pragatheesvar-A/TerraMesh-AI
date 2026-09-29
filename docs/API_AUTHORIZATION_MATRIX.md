# API Authorization Matrix

| Method | Path | Authenticated | Role Restricted | Mine Isolated |
|---|---|---|---|---|
| POST | `/api/login` | NO | NO | N/A |
| GET | `/api/workers` | YES | YES | YES |
| POST | `/api/evacuation/broadcast` | YES | YES | YES |
| POST | `/api/alerts/{id}/acknowledge`| YES | YES | YES |
| GET | `/api/health` | NO | NO | N/A |
