import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ title }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="page-title">{title}</span>
      </div>
      <div className="navbar-right">
        <div className="live-indicator">
          <div className="live-dot" />
          Live
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Clock size={13} />
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}
