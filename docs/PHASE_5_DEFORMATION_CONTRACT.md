# PHASE 5 DEFORMATION CONTRACT

## 1. Canonical Schema
`DeformationProductModel` defines the output contract for extracted interferogram regions:
* `los_displacement`: Line-Of-Sight displacement (mm). **Not to be confused with vertical settlement**.
* `velocity`: Displacement rate (mm/year).
* `coherence`: Processing confidence/quality score (0.0 - 1.0).
* `quality`: Enums (`VALID`, `LOW_COHERENCE`, `MASKED`).
* `units`: Canonical standard is `mm`.
* `source` / `provenance`: Strictly maintained (e.g., `SIMULATED SATELLITE DATA`).

## 2. Status
**CLASSIFICATION: VERIFIED SOFTWARE CONTRACT**
