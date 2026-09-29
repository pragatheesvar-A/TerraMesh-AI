# PHASE 5 INSAR PROCESSING

## 1. Processing Pipeline
The architecture supports tracking InSAR jobs through `ProcessingJobModel`. Job states are strictly enforced (`QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `SIMULATED`).

## 2. Reality Boundary
TerraMesh AI does **NOT** contain an internal SAR processing engine (like SNAP or ISCE). The system relies on external services to perform coregistration, interferogram generation, phase unwrapping, and geocoding.

## 3. Status
**CLASSIFICATION: SIMULATION ONLY / EXTERNAL STACK REQUIRED**
