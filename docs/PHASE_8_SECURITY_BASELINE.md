# Phase 8 Security Baseline

| Security Area | Existing Control | Test Evidence | Runtime Evidence | Gap | Status |
|---|---|---|---|---|---|
| Authentication | PBKDF2/HMAC Tokens | `test_security.py` | `auth.py` | None | VERIFIED |
| TLS | Proxy level | Missing | Dev Environment | Prod Certs | PARTIAL |
| RBAC | Token role scopes | `test_security.py` | `auth.py` | Granular endpoint checks | PARTIAL |
| Rate Limiting | `slowapi` | N/A | `main.py` | N/A | VERIFIED |
| Secret Management | `.env` variables | `secret_scan.py` passes | None | None | VERIFIED |
| Audit Logging | `audit_service.py` | Regression passes | DB schemas | None | VERIFIED |
