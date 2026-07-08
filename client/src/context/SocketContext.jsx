import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('diq_token');
    socketRef.current = io('http://localhost:5000', {
      auth: { token: token || null },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    socketRef.current.on('escalation:alert', (data) => {
      setEscalations(prev => [data, ...prev].slice(0, 20));
      // Play alert sound for high priority
      if (data.severity === 'high') {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch {}
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const joinUnitRoom = (unitId) => {
    socketRef.current?.emit('unit:join', { unitId });
  };

  const emitUnitPosition = (unitId, coordinates) => {
    socketRef.current?.emit('unit:position', { unitId, coordinates });
  };

  const emitAck = (incidentId, unitId) => {
    socketRef.current?.emit('unit:ack', { incidentId, unitId });
  };

  const onEvent = (event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  const clearEscalation = (idx) => {
    setEscalations(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      escalations,
      clearEscalation,
      joinUnitRoom,
      emitUnitPosition,
      emitAck,
      onEvent,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
