/**
 * TerraMesh AI — Coordinate Transformation Utilities
 * =================================================
 * 
 * Converts between canonical EPSG:4326 coordinates and Three.js world coordinates.
 * 
 * IMPORTANT: Three.js coordinates are for VISUALIZATION ONLY.
 * They are NOT survey-grade coordinates.
 * 
 * Canonical source: PostgreSQL/PostGIS (EPSG:4326)
 * Visualization target: Three.js world coordinates (arbitrary units)
 */

/**
 * Mine center reference point (Jharia Basin)
 * This is the origin for local coordinate transformation.
 */
const MINE_CENTER = {
  lat: 23.6543,  // Reference latitude (degrees)
  lng: 86.4245,  // Reference longitude (degrees)
  elevation: 0.0 // Reference elevation (meters MSL)
};

/**
 * Visualization scaling factor.
 * 1 meter = 0.01 Three.js units (for visualization scale)
 */
const VISUALIZATION_SCALE = 0.01;

/**
 * Vertical exaggeration factor (if used).
 * Set to 1.0 for no exaggeration.
 */
const VERTICAL_EXAGGERATION = 1.0;

/**
 * Earth radius in meters (for haversine approximation)
 */
const EARTH_RADIUS = 6371000;

/**
 * Convert EPSG:4326 (degrees) to local meters (Cartesian).
 * 
 * Uses a simplified approximation suitable for mine-scale distances.
 * Not intended for survey-grade precision.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} centerLat - Reference latitude in degrees
 * @param {number} centerLng - Reference longitude in degrees
 * @returns {Object} Local coordinates {x, y} in meters
 */
export function latLngToMeters(lat, lng, centerLat = MINE_CENTER.lat, centerLng = MINE_CENTER.lng) {
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLng = (lng - centerLng) * Math.PI / 180;
  
  const latRad = centerLat * Math.PI / 180;
  
  const x = EARTH_RADIUS * dLng * Math.cos(latRad);
  const y = EARTH_RADIUS * dLat;
  
  return { x, y };
}

/**
 * Convert local meters to EPSG:4326 (degrees).
 * 
 * @param {number} x - Local X coordinate in meters
 * @param {number} y - Local Y coordinate in meters
 * @param {number} centerLat - Reference latitude in degrees
 * @param {number} centerLng - Reference longitude in degrees
 * @returns {Object} EPSG:4326 coordinates {lat, lng} in degrees
 */
export function metersToLatLng(x, y, centerLat = MINE_CENTER.lat, centerLng = MINE_CENTER.lng) {
  const latRad = centerLat * Math.PI / 180;
  
  const dLng = x / (EARTH_RADIUS * Math.cos(latRad));
  const dLat = y / EARTH_RADIUS;
  
  const lat = centerLat + dLat * 180 / Math.PI;
  const lng = centerLng + dLng * 180 / Math.PI;
  
  return { lat, lng };
}

/**
 * Convert local meters to Three.js world coordinates.
 * 
 * Applies visualization scaling and axis transformation.
 * 
 * @param {number} x - Local X coordinate in meters
 * @param {number} y - Local Y coordinate in meters
 * @param {number} z - Local Z coordinate (elevation) in meters
 * @returns {Object} Three.js coordinates {x, y, z}
 */
export function metersToThreeJs(x, y, z) {
  return {
    x: x * VISUALIZATION_SCALE,
    y: z * VISUALIZATION_SCALE * VERTICAL_EXAGGERATION,  // Invert Z for Three.js Y
    z: -y * VISUALIZATION_SCALE // Invert Y for Three.js Z
  };
}

/**
 * Convert Three.js world coordinates to local meters.
 * 
 * @param {number} x - Three.js X coordinate
 * @param {number} y - Three.js Y coordinate
 * @param {number} z - Three.js Z coordinate
 * @returns {Object} Local coordinates {x, y, z} in meters
 */
export function threeJsToMeters(x, y, z) {
  return {
    x: x / VISUALIZATION_SCALE,
    y: -z / VISUALIZATION_SCALE,  // Invert Z to get Y
    z: y / (VISUALIZATION_SCALE * VERTICAL_EXAGGERATION) // Invert Y to get Z
  };
}

/**
 * Convert EPSG:4326 to Three.js world coordinates.
 * 
 * Full transformation pipeline:
 * EPSG:4326 → Local Meters → Three.js World Coordinates
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} elevation - Elevation in meters
 * @returns {Object} Three.js coordinates {x, y, z}
 */
export function epsg4326ToThreeJs(lat, lng, elevation = 0) {
  const localMeters = latLngToMeters(lat, lng);
  const threeJsCoords = metersToThreeJs(localMeters.x, localMeters.y, elevation);
  return threeJsCoords;
}

/**
 * Convert Three.js world coordinates to EPSG:4326.
 * 
 * Reverse transformation pipeline:
 * Three.js World Coordinates → Local Meters → EPSG:4326
 * 
 * @param {number} x - Three.js X coordinate
 * @param {number} y - Three.js Y coordinate
 * @param {number} z - Three.js Z coordinate
 * @returns {Object} EPSG:4326 coordinates {lat, lng, elevation}
 */
export function threeJsToEpsg4326(x, y, z) {
  const localMeters = threeJsToMeters(x, y, z);
  const latLng = metersToLatLng(localMeters.x, localMeters.y);
  return {
    lat: latLng.lat,
    lng: latLng.lng,
    elevation: localMeters.z
  };
}

/**
 * Validate EPSG:4326 coordinates.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {Object} Validation result {valid, errors}
 */
export function validateEpsg4326(lat, lng) {
  const errors = [];

  if (lat === null || lat === undefined) {
    errors.push('Latitude is required');
  } else if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push('Latitude must be a number');
  } else if (lat < -90 || lat > 90) {
    errors.push(`Latitude ${lat} is out of range (-90 to 90)`);
  }

  if (lng === null || lng === undefined) {
    errors.push('Longitude is required');
  } else if (typeof lng !== 'number' || isNaN(lng)) {
    errors.push('Longitude must be a number');
  } else if (lng < -180 || lng > 180) {
    errors.push(`Longitude ${lng} is out of range (-180 to 180)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate distance between two EPSG:4326 points using Haversine formula.
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
}

/**
 * Get mine center reference point.
 * 
 * @returns {Object} Mine center {lat, lng, elevation}
 */
export function getMineCenter() {
  return { ...MINE_CENTER };
}

/**
 * Set mine center reference point (for different mine sites).
 * 
 * @param {number} lat - Reference latitude in degrees
 * @param {number} lng - Reference longitude in degrees
 * @param {number} elevation - Reference elevation in meters
 */
export function setMineCenter(lat, lng, elevation = 0.0) {
  MINE_CENTER.lat = lat;
  MINE_CENTER.lng = lng;
  MINE_CENTER.elevation = elevation;
}

/**
 * Get visualization scaling factor.
 * 
 * @returns {number} Visualization scale
 */
export function getVisualizationScale() {
  return VISUALIZATION_SCALE;
}

/**
 * Set visualization scaling factor.
 * 
 * @param {number} scale - New scaling factor
 */
export function setVisualizationScale(scale) {
  if (scale > 0 && scale <= 1.0) {
    VISUALIZATION_SCALE = scale;
  }
}

/**
 * Get vertical exaggeration factor.
 * 
 * @returns {number} Vertical exaggeration
 */
export function getVerticalExaggeration() {
  return VERTICAL_EXAGGERATION;
}

/**
 * Set vertical exaggeration factor.
 * 
 * @param {number} exaggeration - New vertical exaggeration (1.0 = no exaggeration)
 */
export function setVerticalExaggeration(exaggeration) {
  if (exaggeration > 0 && exaggeration <= 10.0) {
    VERTICAL_EXAGGERATION = exaggeration;
  }
}

/**
 * Transform procedural Three.js coordinates to labeled metadata.
 * 
 * This is used for procedural engineering reference layers that don't
 * have real backend coordinates. It adds explicit provenance labeling.
 * 
 * @param {Object} threeJsCoords - Three.js coordinates {x, y, z}
 * @param {string} layerName - Name of the layer
 * @returns {Object} Metadata with provenance labeling
 */
export function proceduralCoordsToMetadata(threeJsCoords, layerName) {
  return {
    coordinates: threeJsCoords,
    source: 'PROCEDURAL_REFERENCE',
    classification: 'ENGINEERING',
    surveyGrade: false,
    operational: false,
    layerName,
    label: 'PROCEDURAL • ENGINEERING REFERENCE'
  };
}
