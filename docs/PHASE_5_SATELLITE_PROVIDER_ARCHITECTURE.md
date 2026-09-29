# PHASE 5 SATELLITE PROVIDER ARCHITECTURE

## 1. Provider Interface
Defined in `backend/remote_sensing/providers.py`, the `InSARProvider` class exposes `fetch_interferogram` and `status` methods.

## 2. Implementations
* **SentinelProvider:** Configured to read `COP_USER` and `COP_PASSWORD` environment variables. Fails with `CONFIGURATION_REQUIRED` if absent, or `UNAVAILABLE` if the external SNAP/ISCE stack is missing.
* **NISARProvider:** Fails with `CONFIGURATION_REQUIRED` pending ISRO/NASA access.
* **MockInSARProvider:** Generates synthetic grids with `PROVENANCE_SIMULATED`.

## 3. Status
**CLASSIFICATION: ARCHITECTURE COMPLETE / REAL INTEGRATION BLOCKED**
