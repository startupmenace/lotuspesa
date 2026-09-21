import { useEffect, useRef, useState, useCallback } from 'react';
import type { SSEEvent } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key';

export function useSSE(url: string) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);

  const connect = useCallback(() => {
    const separator = url.includes('?') ? '&' : '?';
    const eventSource = new EventSource(url + separator + 'key=' + API_KEY);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        setEvents(prev => [event, ...prev].slice(0, 50));
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
      retriesRef.current++;
      // Exponential backoff: 3s, 6s, 12s, max 30s
      const delay = Math.min(3000 * Math.pow(2, retriesRef.current - 1), 30000);
      setTimeout(connect, delay);
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);

  return { events, connected };
}
