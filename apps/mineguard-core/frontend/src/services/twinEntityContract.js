/**
 * TerraMesh AI — Canonical Digital Twin Entity Contract
 * ===================================================
 * 
 * Single shared representation for every object visualized in the 3D Digital Twin.
 * 
 * This contract ensures:
 * - ONE canonical mapping between Backend ID ↔ GIS ID ↔ Twin ID
 * - Explicit provenance classification for all entities
 * - Clear separation between MEASURED, SIMULATION, and REFERENCE data
 * - No array-index identities
 * - No display-name primary identifiers
 * 
 * PostGIS backend (EPSG:4326) is the single source of truth for spatial data.
 * The 3D Twin is a visualization layer only.
 */

/**
 * @typedef {Object} TwinEntity
 * @property {string} id - Canonical entity identifier (from backend)
 * @property {"panel"|"zone"|"sensor"|"worker"|"route"|"borehole"|"fault"|"tunnel"|"strata"|"surface"|"risk_area"} entity_type
 * @property {string} [name] - Human-readable name
 * @property {"POSTGIS"|"BACKEND"|"PROCEDURAL_REFERENCE"|"SIMULATION"} geometry_source
 * @property {"MEASURED"|"MODEL"|"SIMULATION"|"ENGINEERING"|"OPERATOR"|"SATELLITE"|"EDGE_HARDWARE"|"EDGE_EMULATOR"|"REFERENCE"} data_state
 * @property {string} [status] - Operational status
 * @property {number} [latitude] - Latitude in EPSG:4326 (from backend)
 * @property {number} [longitude] - Longitude in EPSG:4326 (from backend)
 * @property {number} [elevation_m] - Elevation in meters (from backend)
 * @property {string} [timestamp] - Last update timestamp (ISO 8601)
 * @property {string} [version] - Data version
 * @property {string} source_label - Human-readable source description
 * @property {number|null} [confidence] - Confidence score (0-100)
 * @property {string|null} [last_updated] - Last update time (human-readable)
 */

/**
 * Normalize a backend entity into a canonical Twin entity.
 * 
 * @param {Object} backendEntity - Entity from backend API
 * @param {string} entityType - Type of entity (sensor, worker, zone, etc.)
 * @param {string} geometrySource - Source of geometry (POSTGIS, BACKEND, PROCEDURAL_REFERENCE, SIMULATION)
 * @param {string} dataState - State of data (MEASURED, SIMULATION, ENGINEERING, etc.)
 * @returns {TwinEntity} Normalized Twin entity
 */
export function normalizeTwinEntity(backendEntity, entityType, geometrySource, dataState) {
  if (!backendEntity) {
    return null;
  }

  const base = {
    id: backendEntity.id || backendEntity.code || backendEntity.node_id,
    entity_type: entityType,
    name: backendEntity.name || backendEntity.code || backendEntity.node_id,
    geometry_source: geometrySource,
    data_state: dataState,
    status: backendEntity.status || backendEntity.state || null,
    latitude: backendEntity.lat !== undefined ? backendEntity.lat : null,
    longitude: backendEntity.lng !== undefined ? backendEntity.lng : null,
    elevation_m: backendEntity.depth_m !== undefined ? backendEntity.depth_m : null,
    timestamp: backendEntity.last_update || backendEntity.updated_at || null,
    version: '1.0',
    source_label: determineSourceLabel(geometrySource, dataState),
    confidence: backendEntity.confidence || null,
    last_updated: backendEntity.last_update || backendEntity.updated_at || null,
  };

  return base;
}

/**
 * Determine human-readable source label based on geometry source and data state.
 */
function determineSourceLabel(geometrySource, dataState) {
  const sourceLabels = {
    'POSTGIS-MEASURED': 'POSTGIS • MEASURED',
    'POSTGIS-ENGINEERING': 'POSTGIS • ENGINEERING',
    'BACKEND-MEASURED': 'BACKEND • MEASURED',
    'BACKEND-SIMULATION': 'BACKEND • SIMULATION',
    'PROCEDURAL_REFERENCE-ENGINEERING': 'PROCEDURAL • ENGINEERING REFERENCE',
    'PROCEDURAL_REFERENCE-SIMULATION': 'PROCEDURAL • SIMULATION',
    'SIMULATION-SIMULATION': 'SIMULATION • DEMO',
  };

  const key = `${geometrySource}-${dataState}`;
  return sourceLabels[key] || `${geometrySource} • ${dataState}`;
}

/**
 * Geometry Source classifications
 */
export const GEOMETRY_SOURCE = {
  POSTGIS: 'POSTGIS',
  BACKEND: 'BACKEND',
  PROCEDURAL_REFERENCE: 'PROCEDURAL_REFERENCE',
  SIMULATION: 'SIMULATION',
};

/**
 * Data State classifications
 */
export const DATA_STATE = {
  MEASURED: 'MEASURED',
  MODEL: 'MODEL',
  SIMULATION: 'SIMULATION',
  ENGINEERING: 'ENGINEERING',
  OPERATOR: 'OPERATOR',
  SATELLITE: 'SATELLITE',
  EDGE_HARDWARE: 'EDGE_HARDWARE',
  EDGE_EMULATOR: 'EDGE_EMULATOR',
  REFERENCE: 'REFERENCE',
};

/**
 * Entity Type classifications
 */
export const ENTITY_TYPE = {
  PANEL: 'panel',
  ZONE: 'zone',
  SENSOR: 'sensor',
  WORKER: 'worker',
  ROUTE: 'route',
  BOREHOLE: 'borehole',
  FAULT: 'fault',
  TUNNEL: 'tunnel',
  STRATA: 'strata',
  SURFACE: 'surface',
  RISK_AREA: 'risk_area',
};

/**
 * Validate that a Twin entity has required fields.
 * 
 * @param {TwinEntity} entity - Twin entity to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateTwinEntity(entity) {
  const errors = [];

  if (!entity.id) {
    errors.push('Missing required field: id');
  }

  if (!entity.entity_type) {
    errors.push('Missing required field: entity_type');
  }

  if (!Object.values(ENTITY_TYPE).includes(entity.entity_type)) {
    errors.push(`Invalid entity_type: ${entity.entity_type}`);
  }

  if (!entity.geometry_source) {
    errors.push('Missing required field: geometry_source');
  }

  if (!Object.values(GEOMETRY_SOURCE).includes(entity.geometry_source)) {
    errors.push(`Invalid geometry_source: ${entity.geometry_source}`);
  }

  if (!entity.data_state) {
    errors.push('Missing required field: data_state');
  }

  if (!Object.values(DATA_STATE).includes(entity.data_state)) {
    errors.push(`Invalid data_state: ${entity.data_state}`);
  }

  // Coordinate validation (if present)
  if (entity.latitude !== null && (entity.latitude < -90 || entity.latitude > 90)) {
    errors.push(`Invalid latitude: ${entity.latitude} (must be -90 to 90)`);
  }

  if (entity.longitude !== null && (entity.longitude < -180 || entity.longitude > 180)) {
    errors.push(`Invalid longitude: ${entity.longitude} (must be -180 to 180)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a Twin entity for procedural engineering reference layers.
 * 
 * @param {string} id - Canonical identifier
 * @param {string} name - Human-readable name
 * @param {string} entityType - Type of entity
 * @param {string} description - Description of the layer
 * @returns {TwinEntity} Twin entity for procedural reference
 */
export function createProceduralReferenceEntity(id, name, entityType, description) {
  return {
    id,
    entity_type: entityType,
    name,
    geometry_source: GEOMETRY_SOURCE.PROCEDURAL_REFERENCE,
    data_state: DATA_STATE.ENGINEERING,
    status: 'STATIC',
    latitude: null,
    longitude: null,
    elevation_m: null,
    timestamp: null,
    version: '1.0',
    source_label: 'PROCEDURAL • ENGINEERING REFERENCE',
    confidence: null,
    last_updated: null,
    description,
  };
}

/**
 * Create a Twin entity for simulation/what-if layers.
 * 
 * @param {string} id - Canonical identifier
 * @param {string} name - Human-readable name
 * @param {string} entityType - Type of entity
 * @param {string} description - Description of the simulation
 * @returns {TwinEntity} Twin entity for simulation
 */
export function createSimulationEntity(id, name, entityType, description) {
  return {
    id,
    entity_type: entityType,
    name,
    geometry_source: GEOMETRY_SOURCE.SIMULATION,
    data_state: DATA_STATE.SIMULATION,
    status: 'SIMULATION',
    latitude: null,
    longitude: null,
    elevation_m: null,
    timestamp: new Date().toISOString(),
    version: '1.0',
    source_label: 'SIMULATION • WHAT-IF',
    confidence: null,
    last_updated: new Date().toISOString(),
    description,
  };
}

/**
 * Merge Twin entity with runtime 3D scene metadata.
 * 
 * @param {TwinEntity} entity - Canonical Twin entity
 * @param {Object} metadata - 3D scene metadata (mesh reference, etc.)
 * @returns {TwinEntity} Merged entity with metadata
 */
export function mergeWithMetadata(entity, metadata) {
  return {
    ...entity,
    ...metadata,
  };
}

/**
 * Extract canonical ID from various possible ID fields.
 * Handles different backend response formats.
 * 
 * @param {Object} backendEntity - Entity from backend API
 * @returns {string|null} Canonical ID or null if not found
 */
export function extractCanonicalId(backendEntity) {
  return backendEntity.id || 
         backendEntity.code || 
         backendEntity.node_id || 
         backendEntity.worker_id || 
         backendEntity.sensor_id || 
         backendEntity.route_id || 
         backendEntity.zone_id || 
         backendEntity.panel_id || 
         null;
}

/**
 * Check if an entity is live (measured) vs simulation/reference.
 * 
 * @param {TwinEntity} entity - Twin entity to check
 * @returns {boolean} True if entity is live/measured
 */
export function isLiveEntity(entity) {
  if (!entity) return false;
  return entity.data_state === DATA_STATE.MEASURED || 
         entity.data_state === DATA_STATE.SATELLITE ||
         entity.data_state === DATA_STATE.EDGE_HARDWARE;
}

/**
 * Check if an entity is procedural reference geometry.
 * 
 * @param {TwinEntity} entity - Twin entity to check
 * @returns {boolean} True if entity is procedural reference
 */
export function isProceduralReference(entity) {
  if (!entity) return false;
  return entity.geometry_source === GEOMETRY_SOURCE.PROCEDURAL_REFERENCE &&
         (entity.data_state === DATA_STATE.ENGINEERING || 
          entity.data_state === DATA_STATE.REFERENCE);
}

/**
 * Check if an entity is simulation/what-if.
 * 
 * @param {TwinEntity} entity - Twin entity to check
 * @returns {boolean} True if entity is simulation
 */
export function isSimulationEntity(entity) {
  if (!entity) return false;
  return entity.data_state === DATA_STATE.SIMULATION ||
         entity.geometry_source === GEOMETRY_SOURCE.SIMULATION;
}

/**
 * Format provenance label for UI display.
 * 
 * @param {TwinEntity} entity - Twin entity
 * @returns {string} Formatted provenance label
 */
export function formatProvenanceLabel(entity) {
  if (!entity) return 'UNKNOWN';
  
  const stateIcon = {
    [DATA_STATE.MEASURED]: '📡',
    [DATA_STATE.SATELLITE]: '🛰️',
    [DATA_STATE.MODEL]: '🧠',
    [DATA_STATE.SIMULATION]: '🎭',
    [DATA_STATE.ENGINEERING]: '🏗️',
    [DATA_STATE.OPERATOR]: '👤',
    [DATA_STATE.REFERENCE]: '📋',
  };

  const icon = stateIcon[entity.data_state] || '❓';
  
  return `${icon} ${entity.source_label}`;
}

/**
 * Create a sync state indicator for 2D/3D verification.
 * 
 * @param {string} state - Sync state (SYNCED, STALE, MISSING_IN_TWIN, MISSING_IN_GIS, MISMATCH, UNKNOWN)
 * @returns {Object} Sync state with icon and color
 */
export function getSyncState(state) {
  const states = {
    SYNCED: { icon: '✓', color: 'text-emerald-400', label: 'SYNCED' },
    STALE: { icon: '⏰', color: 'text-amber-400', label: 'STALE' },
    MISSING_IN_TWIN: { icon: '❌', color: 'text-rose-400', label: 'MISSING IN TWIN' },
    MISSING_IN_GIS: { icon: '❌', color: 'text-rose-400', label: 'MISSING IN GIS' },
    MISMATCH: { icon: '⚠️', color: 'text-orange-400', label: 'MISMATCH' },
    UNKNOWN: { icon: '❓', color: 'text-slate-400', label: 'UNKNOWN' },
  };

  return states[state] || states.UNKNOWN;
}
