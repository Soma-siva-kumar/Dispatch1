import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API from '../api/axios';

const SocketContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const NOTIFICATION_SOUND_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/assets/ai-emergency-alert.mp3`;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationPulse, setNotificationPulse] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const getNotificationAudio = () => {
    if (!notificationAudioRef.current) {
      notificationAudioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      notificationAudioRef.current.preload = 'auto';
      notificationAudioRef.current.volume = 0.72;
    }
    return notificationAudioRef.current;
  };

  const playNotificationSound = () => {
    try {
      const audio = getNotificationAudio();
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    // Don't connect if no user is logged in
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSocketReady(false);
      setNotifications([]);
      notificationAudioRef.current?.pause();
      return;
    }

    const token = localStorage.getItem('diq_token');
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      auth: { token: token || null },
      transports: ['websocket'],
    });

    setSocketReady(true);
    getNotificationAudio().load();

    API.get('/notifications')
      .then(r => setNotifications(r.data))
      .catch(() => setNotifications([]));

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

    socketRef.current.on('notification:new', ({ notification }) => {
      setNotifications(prev => {
        if (prev.some(item => item._id === notification._id)) return prev;
        return [notification, ...prev].slice(0, 100);
      });
      setNotificationPulse(true);
      window.setTimeout(() => setNotificationPulse(false), 650);
      playNotificationSound();
    });

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

  const clearEscalation = (idx) => {
    setEscalations(prev => prev.filter((_, i) => i !== idx));
  };

  const markNotificationRead = async (id) => {
    try {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      }
    } catch (e) {}
    const { data } = await API.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(item => item._id === id ? data : item));
  };

  const markAllNotificationsRead = async () => {
    try {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      }
    } catch (e) {}
    const { data } = await API.patch('/notifications/read-all');
    setNotifications(data);
  };

  const clearNotifications = async () => {
    await API.delete('/notifications');
    setNotifications([]);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      socketReady,
      escalations,
      notifications,
      notificationPulse,
      clearEscalation,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
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
