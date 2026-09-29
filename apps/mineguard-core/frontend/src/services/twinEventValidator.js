/**
 * Twin Event Validator
 * ====================
 * Validates real-time Twin events from WebSocket backend.
 * Ensures event integrity, prevents stale/duplicate overwrites,
 * and enforces event ordering rules.
 */

const VALID_ENTITY_TYPES = [
  'sensor',
  'worker',
  'zone',
  'route',
  'panel',
  'borehole',
  'fault',
  'tunnel',
  'strata',
  'surface',
  'risk_area'
];

const VALID_EVENT_TYPES = [
  'status_update',
  'telemetry_update',
  'risk_update',
  'location_update',
  'alert',
  'route_update'
];

const VALID_SOURCES = [
  'websocket',
  'mqtt',
  'backend',
  'simulation'
];

// Recent event cache for duplicate detection (max 1000 events)
const recentEventIds = new Set();
const MAX_RECENT_EVENTS = 1000;

// Entity timestamp cache for stale event detection
const entityTimestamps = new Map();

/**
 * Validate a Twin real-time event
 * @param {Object} event - The event to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateTwinEvent(event) {
  const errors = [];

  // Required fields
  if (!event.event_id) {
    errors.push('Missing required field: event_id');
  }
  if (!event.entity_id) {
    errors.push('Missing required field: entity_id');
  }
  if (!event.entity_type) {
    errors.push('Missing required field: entity_type');
  } else if (!VALID_ENTITY_TYPES.includes(event.entity_type)) {
    errors.push(`Invalid entity_type: ${event.entity_type}. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }
  if (!event.event_type) {
    errors.push('Missing required field: event_type');
  } else if (!VALID_EVENT_TYPES.includes(event.event_type)) {
    errors.push(`Invalid event_type: ${event.event_type}. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`);
  }
  if (!event.source) {
    errors.push('Missing required field: source');
  } else if (!VALID_SOURCES.includes(event.source)) {
    errors.push(`Invalid source: ${event.source}. Must be one of: ${VALID_SOURCES.join(', ')}`);
  }
  if (!event.timestamp) {
    errors.push('Missing required field: timestamp');
  } else if (!isValidISO8601(event.timestamp)) {
    errors.push('Invalid timestamp format. Must be ISO 8601');
  }
  if (!event.payload) {
    errors.push('Missing required field: payload');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if an event is a duplicate
 * @param {string} eventId - The event ID to check
 * @returns {boolean} - True if duplicate
 */
export function isDuplicateEvent(eventId) {
  if (recentEventIds.has(eventId)) {
    return true;
  }
  recentEventIds.add(eventId);
  
  // Prune old entries if cache is too large
  if (recentEventIds.size > MAX_RECENT_EVENTS) {
    const first = recentEventIds.values().next().value;
    recentEventIds.delete(first);
  }
  
  return false;
}

/**
 * Check if an event is stale (older than current entity state)
 * @param {string} entityId - The entity ID
 * @param {string} eventTimestamp - The event timestamp (ISO 8601)
 * @returns {boolean} - True if event is stale
 */
export function isStaleEvent(entityId, eventTimestamp) {
  const currentTimestamp = entityTimestamps.get(entityId);
  if (!currentTimestamp) {
    return false; // No current state, event is not stale
  }
  
  const eventTime = new Date(eventTimestamp).getTime();
  const currentTime = new Date(currentTimestamp).getTime();
  
  return eventTime <= currentTime;
}

/**
 * Update entity timestamp cache
 * @param {string} entityId - The entity ID
 * @param {string} timestamp - The timestamp (ISO 8601)
 */
export function updateEntityTimestamp(entityId, timestamp) {
  entityTimestamps.set(entityId, timestamp);
}

/**
 * Validate ISO 8601 timestamp
 * @param {string} timestamp - The timestamp to validate
 * @returns {boolean} - True if valid
 */
function isValidISO8601(timestamp) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  return iso8601Regex.test(timestamp);
}

/**
 * Process a Twin event with full validation pipeline
 * @param {Object} event - The event to process
 * @returns {Object} - { shouldProcess: boolean, reason: string, errors: string[] }
 */
export function processTwinEvent(event) {
  // Step 1: Validate event structure
  const validation = validateTwinEvent(event);
  if (!validation.valid) {
    return {
      shouldProcess: false,
      reason: 'VALIDATION_FAILED',
      errors: validation.errors
    };
  }

  // Step 2: Check for duplicate events
  if (isDuplicateEvent(event.event_id)) {
    return {
      shouldProcess: false,
      reason: 'DUPLICATE_EVENT',
      errors: []
    };
  }

  // Step 3: Check for stale events
  if (isStaleEvent(event.entity_id, event.timestamp)) {
    return {
      shouldProcess: false,
      reason: 'STALE_EVENT',
      errors: []
    };
  }

  // Step 4: Update entity timestamp
  updateEntityTimestamp(event.entity_id, event.timestamp);

  return {
    shouldProcess: true,
    reason: 'VALID',
    errors: []
  };
}

/**
 * Clear all caches (useful for testing or reconnection)
 */
export function clearEventCaches() {
  recentEventIds.clear();
  entityTimestamps.clear();
}

/**
 * Get cache statistics (for debugging)
 * @returns {Object} - Cache statistics
 */
export function getEventCacheStats() {
  return {
    recentEventCount: recentEventIds.size,
    entityTimestampCount: entityTimestamps.size,
    maxRecentEvents: MAX_RECENT_EVENTS
  };
}
