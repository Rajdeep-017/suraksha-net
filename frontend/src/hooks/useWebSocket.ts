import { useState, useEffect, useRef, useCallback } from 'react';
import type { WSAlert } from '../api/client';

interface UseWebSocketOptions {
  enabled: boolean;
  maxAlerts?: number;
}

export function useWebSocket(sessionId: string, options: UseWebSocketOptions) {
  const { enabled, maxAlerts = 10 } = options;
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<WSAlert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !sessionId) return;

    try {
      const ws = new WebSocket(`ws://127.0.0.1:8000/ws/alerts/${sessionId}`);

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        console.log('[WS] Connected to alerts');
      };

      ws.onmessage = (event) => {
        try {
          const alert: WSAlert = JSON.parse(event.data);
          setAlerts(prev => {
            const updated = [alert, ...prev];
            return updated.slice(0, maxAlerts);
          });
        } catch (e) {
          console.warn('[WS] Invalid message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        // Exponential backoff reconnect
        if (enabled) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // WebSocket not available
    }
  }, [enabled, sessionId, maxAlerts]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, connect]);

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { connected, alerts, dismissAlert, clearAlerts };
}
