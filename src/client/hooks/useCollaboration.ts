import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthToken } from '../api.js';

interface CollabUser {
  userId: string;
  userName: string;
  color: string;
}

interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

interface CollabState {
  connected: boolean;
  users: CollabUser[];
  cursors: Map<string, CursorPosition>;
  chatMessages: Array<{ userId: string; userName: string; color: string; message: string; timestamp: string }>;
}

export function useCollaboration(swarmId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<CollabState>({
    connected: false,
    users: [],
    cursors: new Map(),
    chatMessages: [],
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = 3001; // API port
    const token = getAuthToken() || '';
    const url = `${protocol}//${host}:${port}/ws?swarmId=${encodeURIComponent(swarmId)}&token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(prev => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, connected: false, users: [], cursors: new Map() }));
    };

    ws.onerror = () => {
      // WebSocket errors are expected when server isn't running
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [swarmId]);

  function handleMessage(msg: { type: string; payload: any }) {
    switch (msg.type) {
      case 'presence.init':
        setState(prev => ({ ...prev, users: msg.payload.users || [] }));
        break;
      case 'presence.joined':
        setState(prev => ({ ...prev, users: msg.payload.users || [] }));
        break;
      case 'presence.left':
        setState(prev => {
          const cursors = new Map(prev.cursors);
          cursors.delete(msg.payload.userId);
          return { ...prev, users: msg.payload.users || [], cursors };
        });
        break;
      case 'cursor.update':
        setState(prev => {
          const cursors = new Map(prev.cursors);
          cursors.set(msg.payload.userId, msg.payload);
          return { ...prev, cursors };
        });
        break;
      case 'chat.message':
        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages.slice(-99), msg.payload],
        }));
        break;
      case 'swarm.changed':
        // Could trigger a reload here
        break;
    }
  }

  const sendCursor = useCallback((x: number, y: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor.move', payload: { x, y } }));
    }
  }, []);

  const sendAgentSelected = useCallback((agentId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'agent.selected', payload: { agentId } }));
    }
  }, []);

  const sendSwarmChanged = useCallback((changeType: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'swarm.changed', payload: { changeType } }));
    }
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat.message', payload: { message } }));
    }
  }, []);

  return {
    ...state,
    sendCursor,
    sendAgentSelected,
    sendSwarmChanged,
    sendChatMessage,
  };
}
