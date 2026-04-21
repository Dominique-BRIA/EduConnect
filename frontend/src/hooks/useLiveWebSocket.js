import { useEffect, useRef, useCallback } from 'react';

export function useLiveWebSocket(liveId, etudiantId, onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (!liveId) return;
    const token = localStorage.getItem('accessToken');
    const ws = new WebSocket(`ws://localhost:8080/ws/live/${liveId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', token, liveId, etudiantId }));
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current(data);
      } catch {}
    };

    ws.onerror = (e) => console.error('WS Live error', e);

    return () => { ws.close(); };
  }, [liveId, etudiantId]);

  return { send };
}
