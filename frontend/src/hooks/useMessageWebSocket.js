import { useEffect, useRef, useCallback } from 'react';

export function useMessageWebSocket(onMessage) {
  const wsRef = useRef(null);
  const onMsgRef = useRef(onMessage);
  onMsgRef.current = onMessage;

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const ws = new WebSocket('ws://localhost:8080/ws/messages');
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'AUTH', token }));
    ws.onmessage = (evt) => {
      try { onMsgRef.current(JSON.parse(evt.data)); } catch {}
    };
    return () => ws.close();
  }, []);

  return { send };
}
