import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    // Don't connect if no user is logged in
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketReady(false);
      return;
    }

    const token = localStorage.getItem('diq_token');
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      auth: { token: token || null },
      transports: ['websocket'],
    });

    setSocketReady(true);

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketReady(false);
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

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      socketReady,
      escalations: [],
      clearEscalation: () => {},
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
