import { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar({ title }) {
  const { escalations, clearEscalation } = useSocket();
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

        {escalations.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-icon"
              title={`${escalations.length} active escalations`}
            >
              <Bell size={18} style={{ color: 'var(--accent-orange)' }} />
              <span style={{
                position: 'absolute',
                top: '-4px', right: '-4px',
                background: 'var(--p1)',
                color: 'white',
                borderRadius: '50%',
                width: '18px', height: '18px',
                fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>
                {escalations.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

