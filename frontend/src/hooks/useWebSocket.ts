'use client';
import { useEffect, useRef, useCallback } from 'react';
import { WSMessage, JobStatus } from '@/types';
import { useAssignmentStore } from '@/store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useWebSocket(assignmentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const { setJobStatus, updateAssignmentStatus } = useAssignmentStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (assignmentId) {
        ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'job:progress') {
          setJobStatus(msg.payload);
        } else if (msg.type === 'job:completed') {
          setJobStatus(msg.payload);
          updateAssignmentStatus(msg.payload.assignmentId, 'completed');
        } else if (msg.type === 'job:failed') {
          setJobStatus(msg.payload);
          updateAssignmentStatus(msg.payload.assignmentId, 'failed');
        }
      } catch {}
    };

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [assignmentId, setJobStatus, updateAssignmentStatus]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
