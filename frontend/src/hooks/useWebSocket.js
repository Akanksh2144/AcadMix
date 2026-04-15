import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useWebSocket — React hook for authenticated WebSocket connections.
 * 
 * Features:
 * - Auto-reconnect on disconnect (3s delay)
 * - JWT authentication via query param
 * - Connection status tracking
 * - Heartbeat (ping/pong every 30s)
 * 
 * Usage:
 *   const { data, status } = useWebSocket('/ws/transport/route-123');
 *   // data updates in real-time as messages arrive
 *   // status: 'connecting' | 'connected' | 'disconnected'
 */
export function useWebSocket(path, { enabled = true, onMessage } = {}) {
  const [lastMessage, setLastMessage] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);

  const connect = useCallback(() => {
    if (!enabled || !path) return;

    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setStatus('disconnected');
      return;
    }

    // Build WebSocket URL
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const wsBase = backendUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/api/v1${path}?token=${token}`;

    setStatus('connecting');
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus('connected');
      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return; // heartbeat response
      try {
        const parsed = JSON.parse(event.data);
        setLastMessage(parsed);
        onMessage?.(parsed);
      } catch {
        setLastMessage(event.data);
      }
    };

    ws.onclose = (event) => {
      setStatus('disconnected');
      clearInterval(heartbeatInterval.current);
      // Auto-reconnect unless explicitly closed (code 1000)
      if (event.code !== 1000 && enabled) {
        reconnectTimeout.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [path, enabled, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
      clearTimeout(reconnectTimeout.current);
      clearInterval(heartbeatInterval.current);
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return {
    lastMessage,
    status,
    send,
    ws: wsRef.current,
  };
}

export default useWebSocket;
