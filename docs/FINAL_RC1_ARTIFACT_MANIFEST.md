# FINAL RC-1 ARTIFACT MANIFEST

| Artifact | Status | Notes |
|---|---|---|
| Backend Python Package | VERIFIED | pytest 169 passed / 9 skipped |
| Frontend Build (npm run build) | VERIFIED | Vite production build clean |
| Mobile (React Native) | VERIFIED (typecheck) | Device-runtime test NOT executed |
| Database Migrations | VERIFIED | Alembic head applied |
| Docker Compose Config | VERIFIED | docker compose config clean |
| Model Artifacts | VERIFIED | XGBoost v1, Isolation Forest v1 |
| Release Manifest | docs/FINAL_RELEASE_MANIFEST.md | RC-1 |
| Validation Report | artifacts/validation/FINAL_RC1_VALIDATION.json | Machine-readable |

## Release Identity Fingerprint (non-secret)
git commit: dec04eeaa3e242b4acc723998110b5536ba27d10
docs_fingerprint: d65bb692184561f0
audit_timestamp: 2026-09-25T20:37:12.461331Z

CAUTION: No APK binary in repository — mobile build must be triggered separately.
No secrets, credentials, or private keys included in this manifest.
