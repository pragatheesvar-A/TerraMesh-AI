/**
 * Twin Event Router
 * =================
 * Routes validated Twin events to specific entity update functions.
 * Ensures selective 3D scene updates without full scene recreation.
 */

/**
 * Route a validated Twin event to the appropriate handler
 * @param {Object} event - Validated Twin event
 * @param {Object} twinState - Current Twin state
 * @param {Function} updateFn - Callback to trigger React state update
 * @returns {Object} - { handled: boolean, entityType: string, entityId: string }
 */
export function routeTwinEvent(event, twinState, updateFn) {
  const { entity_type, entity_id, event_type, payload } = event;

  switch (entity_type) {
    case 'sensor':
      return handleSensorEvent(event, twinState, updateFn);
    case 'worker':
      return handleWorkerEvent(event, twinState, updateFn);
    case 'zone':
      return handleZoneEvent(event, twinState, updateFn);
    case 'route':
      return handleRouteEvent(event, twinState, updateFn);
    case 'risk_area':
      return handleRiskEvent(event, twinState, updateFn);
    default:
      console.warn(`[Twin Router] Unknown entity type: ${entity_type}`);
      return { handled: false, entityType: entity_type, entityId: entity_id };
  }
}

/**
 * Handle sensor events
 */
function handleSensorEvent(event, twinState, updateFn) {
  const { entity_id, event_type, payload } = event;

  switch (event_type) {
    case 'status_update':
    case 'telemetry_update':
      // Update sensor state without recreating scene
      const updatedSensors = (twinState.sensors || []).map(sensor => {
        if (sensor.id === entity_id) {
          return {
            ...sensor,
            ...payload.data,
            status: payload.ml_prediction?.status || sensor.status,
            ai_risk_score: payload.ml_prediction?.ai_risk_score || sensor.ai_risk_score,
            last_update: "Just now (Live IoT)"
          };
        }
        return sensor;
      });
      
      updateFn({ sensors: updatedSensors });
      return { handled: true, entityType: 'sensor', entityId: entity_id };
      
    default:
      console.warn(`[Twin Router] Unknown sensor event type: ${event_type}`);
      return { handled: false, entityType: 'sensor', entityId: entity_id };
  }
}

/**
 * Handle worker events
 */
function handleWorkerEvent(event, twinState, updateFn) {
  const { entity_id, event_type, payload } = event;

  switch (event_type) {
    case 'location_update':
    case 'status_update':
      // Update worker state without recreating scene
      const updatedWorkers = (twinState.workers || []).map(worker => {
        if (worker.id === entity_id) {
          return {
            ...worker,
            ...payload,
            last_update: payload.timestamp || "Just now"
          };
        }
        return worker;
      });
      
      updateFn({ workers: updatedWorkers });
      return { handled: true, entityType: 'worker', entityId: entity_id };
      
    default:
      console.warn(`[Twin Router] Unknown worker event type: ${event_type}`);
      return { handled: false, entityType: 'worker', entityId: entity_id };
  }
}

/**
 * Handle zone events
 */
function handleZoneEvent(event, twinState, updateFn) {
  const { entity_id, event_type, payload } = event;

  switch (event_type) {
    case 'risk_update':
    case 'status_update':
      // Update zone state without recreating scene
      const updatedZones = (twinState.zones || []).map(zone => {
        if (zone.id === entity_id) {
          return {
            ...zone,
            ...payload,
            last_update: "Just now"
          };
        }
        return zone;
      });
      
      updateFn({ zones: updatedZones });
      return { handled: true, entityType: 'zone', entityId: entity_id };
      
    default:
      console.warn(`[Twin Router] Unknown zone event type: ${event_type}`);
      return { handled: false, entityType: 'zone', entityId: entity_id };
  }
}

/**
 * Handle route events
 */
function handleRouteEvent(event, twinState, updateFn) {
  const { entity_id, event_type, payload } = event;

  switch (event_type) {
    case 'status_update':
      // Update route status without recreating scene
      if (twinState.evacuation && twinState.evacuation.routes) {
        const updatedRoutes = twinState.evacuation.routes.map(route => {
          if (route.route_id === entity_id) {
            return {
              ...route,
              status: payload.status || route.status
            };
          }
          return route;
        });
        
        updateFn({ evacuation: { ...twinState.evacuation, routes: updatedRoutes } });
      }
      return { handled: true, entityType: 'route', entityId: entity_id };
      
    default:
      console.warn(`[Twin Router] Unknown route event type: ${event_type}`);
      return { handled: false, entityType: 'route', entityId: entity_id };
  }
}

/**
 * Handle risk area events
 */
function handleRiskEvent(event, twinState, updateFn) {
  const { entity_id, event_type, payload } = event;

  switch (event_type) {
    case 'risk_update':
      // Update risk state without recreating scene
      const updatedAiRisk = {
        ...twinState.aiRisk,
        current_risk_score: payload.risk_score || twinState.aiRisk?.current_risk_score,
        risk_level: payload.risk_level || twinState.aiRisk?.risk_level
      };
      
      updateFn({ aiRisk: updatedAiRisk });
      return { handled: true, entityType: 'risk_area', entityId: entity_id };
      
    default:
      console.warn(`[Twin Router] Unknown risk event type: ${event_type}`);
      return { handled: false, entityType: 'risk_area', entityId: entity_id };
  }
}

/**
 * Get routing statistics (for debugging)
 * @returns {Object} - Routing statistics
 */
export function getRoutingStats() {
  return {
    supportedEntityTypes: ['sensor', 'worker', 'zone', 'route', 'risk_area'],
    supportedEventTypes: ['status_update', 'telemetry_update', 'location_update', 'risk_update']
  };
}
