# PHASE 5 SCENE CONTRACT

## 1. Canonical Model
The `SatelliteSceneModel` in `backend/insar_models.py` strictly defines the scene contract:

* `id`: Unique Scene Identifier
* `provider`: E.g., `sentinel-1`, `nisar`, `mock`
* `acquisition_time`: ISO-8601 Timestamp
* `footprint`: PostGIS compatible GeoJSON
* `crs`: `EPSG:4326`
* `provenance`: `SIMULATED SATELLITE DATA` or `LIVE SATELLITE DATA`

## 2. Status
**CLASSIFICATION: VERIFIED SOFTWARE CONTRACT**
