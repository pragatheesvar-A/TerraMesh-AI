# PHASE 5 INSAR BASELINE

## 1. Overview
The TerraMesh platform requires satellite deformation insights (InSAR) to complement in-situ ground sensors. This baseline documents the starting point before integrating live Copernicus Sentinel-1 or ISRO NISAR capabilities.

## 2. Current Status
* **Provider Abstraction:** Implemented in `backend/remote_sensing/providers.py` with `SentinelProvider`, `NISARProvider`, and `MockInSARProvider`.
* **Database / Models:** Canonical SQLAlchemy models (`SatelliteScene`, `InSARProcessingJob`, `DeformationProduct`) have been scaffolded to enforce provenance and spatial bounds in PostGIS.
* **Live Integration:** 
  * Sentinel-1: `UNAVAILABLE` / `CONFIGURATION_REQUIRED`
  * NISAR: `CONFIGURATION_REQUIRED`
  * Simulation: Functional but restricted to testing boundaries (provenance is hardcoded to `SIMULATED SATELLITE DATA`).
* **GIS/Digital Twin Integration:** The frontend handles mock interferogram rendering as grids, but real NetCDF/GeoTIFF raster serving is pending real data.

## 3. Guiding Principles
* **Never Fabricate Data:** Simulated data is strictly labeled and cannot pollute the measured time-series database.
* **Explicit Provenance:** Every scene and deformation product must carry `source` and `provenance`.
* **Line of Sight (LOS):** InSAR measures distance along the satellite's line of sight. This is not converted to "vertical settlement" without explicit, documented geometric modeling.
* **Coherence as Confidence:** Poorly coherent areas are masked; they are not smoothed or extrapolated.
