/**
 * WebSocket hook with exponential-backoff reconnection.
 * Handles foreground/background lifecycle via AppState.
 * Mirrors the React web frontend's MineDataContext WS behavior.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../config/env';
import type { ConnectionState } from '../types/models';

type WsMessage = Record<string, unknown> & { type?: string };
type MessageHandler = (msg: WsMessage) => void;
type StateHandler = (state: ConnectionState) => void;

export function useWebSocket(onMessage: MessageHandler, onStateChange?: StateHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const closedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const [connectionState, setConnectionState] = useState<ConnectionState>('OFFLINE');

  const updateState = useCallback((s: ConnectionState) => {
    setConnectionState(s);
    onStateChange?.(s);
  }, [onStateChange]);

  const connect = useCallback(() => {
    if (closedRef.current) return;
    updateState('RECONNECTING');
    try {
      const ws = new WebSocket(API_CONFIG.WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        updateState('ONLINE');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          if (msg.type === 'CONNECTED') updateState('ONLINE');
          onMessage(msg);
        } catch { /* malformed JSON */ }
      };

      ws.onerror = () => {
        updateState('OFFLINE');
      };

      ws.onclose = () => {
        if (closedRef.current) return;
        updateState('OFFLINE');
        scheduleReconnect();
      };
    } catch {
      updateState('OFFLINE');
      scheduleReconnect();
    }
  }, [onMessage, updateState]);

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    const delay = Math.min(2000 * Math.pow(2, attemptsRef.current), 30000);
    attemptsRef.current++;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(connect, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    closedRef.current = true;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    updateState('OFFLINE');
  }, [updateState]);

  // Foreground/background handling
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'background' && nextState === 'active') {
        // App resumed: reconnect + refresh
        closedRef.current = false;
        connect();
      } else if (nextState === 'background') {
        // App backgrounded: close WS to save battery
        wsRef.current?.close();
        updateState('OFFLINE');
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [connect, updateState]);

  // NetInfo listener
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && appStateRef.current === 'active') {
        closedRef.current = false;
        connect();
      }
    });
    return () => unsub();
  }, [connect]);

  // Mount: connect
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'PING' }));
    }
  }, []);

  return { connectionState, sendPing, disconnect };
}
