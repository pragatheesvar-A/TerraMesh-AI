/**
 * Twin Event Validator Tests
 * ===========================
 * Automated tests for Phase 3 Twin event validation
 */

import {
  validateTwinEvent,
  isDuplicateEvent,
  isStaleEvent,
  updateEntityTimestamp,
  processTwinEvent,
  clearEventCaches,
  getEventCacheStats
} from '../twinEventValidator';

describe('Twin Event Validator', () => {
  beforeEach(() => {
    clearEventCaches();
  });

  describe('validateTwinEvent', () => {
    test('valid event passes validation', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      const result = validateTwinEvent(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('missing event_id fails validation', () => {
      const event = {
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      const result = validateTwinEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: event_id');
    });

    test('invalid entity_type fails validation', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'invalid_type',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      const result = validateTwinEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('invalid timestamp format fails validation', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: 'invalid-timestamp',
        payload: { status: 'DANGER' }
      };

      const result = validateTwinEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid timestamp format. Must be ISO 8601');
    });

    test('missing payload fails validation', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z'
      };

      const result = validateTwinEvent(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: payload');
    });
  });

  describe('isDuplicateEvent', () => {
    test('first event is not duplicate', () => {
      const result = isDuplicateEvent('EVT-001');
      expect(result).toBe(false);
    });

    test('second event with same ID is duplicate', () => {
      isDuplicateEvent('EVT-001');
      const result = isDuplicateEvent('EVT-001');
      expect(result).toBe(true);
    });

    test('different event ID is not duplicate', () => {
      isDuplicateEvent('EVT-001');
      const result = isDuplicateEvent('EVT-002');
      expect(result).toBe(false);
    });
  });

  describe('isStaleEvent', () => {
    test('event with no current state is not stale', () => {
      const result = isStaleEvent('NODE-001', '2026-09-25T14:30:00Z');
      expect(result).toBe(false);
    });

    test('newer event is not stale', () => {
      updateEntityTimestamp('NODE-001', '2026-09-25T14:00:00Z');
      const result = isStaleEvent('NODE-001', '2026-09-25T14:30:00Z');
      expect(result).toBe(false);
    });

    test('older event is stale', () => {
      updateEntityTimestamp('NODE-001', '2026-09-25T14:30:00Z');
      const result = isStaleEvent('NODE-001', '2026-09-25T14:00:00Z');
      expect(result).toBe(true);
    });

    test('equal timestamp is stale', () => {
      updateEntityTimestamp('NODE-001', '2026-09-25T14:30:00Z');
      const result = isStaleEvent('NODE-001', '2026-09-25T14:30:00Z');
      expect(result).toBe(true);
    });
  });

  describe('processTwinEvent', () => {
    test('valid event is processed', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      const result = processTwinEvent(event);
      expect(result.shouldProcess).toBe(true);
      expect(result.reason).toBe('VALID');
      expect(result.errors).toEqual([]);
    });

    test('invalid event is not processed', () => {
      const event = {
        event_id: 'EVT-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      const result = processTwinEvent(event);
      expect(result.shouldProcess).toBe(false);
      expect(result.reason).toBe('VALIDATION_FAILED');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('duplicate event is not processed', () => {
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:30:00Z',
        payload: { status: 'DANGER' }
      };

      processTwinEvent(event);
      const result = processTwinEvent(event);
      expect(result.shouldProcess).toBe(false);
      expect(result.reason).toBe('DUPLICATE_EVENT');
    });

    test('stale event is not processed', () => {
      updateEntityTimestamp('NODE-001', '2026-09-25T14:30:00Z');
      
      const event = {
        event_id: 'EVT-001',
        entity_id: 'NODE-001',
        entity_type: 'sensor',
        event_type: 'status_update',
        source: 'websocket',
        timestamp: '2026-09-25T14:00:00Z',
        payload: { status: 'DANGER' }
      };

      const result = processTwinEvent(event);
      expect(result.shouldProcess).toBe(false);
      expect(result.reason).toBe('STALE_EVENT');
    });
  });

  describe('clearEventCaches', () => {
    test('clears all caches', () => {
      isDuplicateEvent('EVT-001');
      updateEntityTimestamp('NODE-001', '2026-09-25T14:30:00Z');
      
      clearEventCaches();
      
      const stats = getEventCacheStats();
      expect(stats.recentEventCount).toBe(0);
      expect(stats.entityTimestampCount).toBe(0);
    });
  });

  describe('getEventCacheStats', () => {
    test('returns cache statistics', () => {
      isDuplicateEvent('EVT-001');
      updateEntityTimestamp('NODE-001', '2026-09-25T14:30:00Z');
      
      const stats = getEventCacheStats();
      expect(stats.recentEventCount).toBe(1);
      expect(stats.entityTimestampCount).toBe(1);
      expect(stats.maxRecentEvents).toBe(1000);
    });
  });
});
