# PHASE 5 SPATIAL CORRELATION

## 1. AOI and Panel Association
Spatial bounds of Satellite Scenes and Deformation Products are natively indexed in PostGIS (`EPSG:4326`). Spatial intersection queries (`ST_Intersects`) are used to link raw deformation polygons back to physical `PanelModel` entities and Mine Boundaries.

## 2. Status
**CLASSIFICATION: VERIFIED**
