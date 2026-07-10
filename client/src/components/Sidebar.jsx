import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard, Map, AlertTriangle, BarChart2,
  Shield, Users, LogOut, Bell, Radio
} from 'lucide-react';

const NAV_ITEMS = {
  dispatcher: [
    { to: '/control-room', icon: Map, label: 'Control Room' },
    { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { to: '/units', icon: Shield, label: 'Patrol Units' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  ],
  admin: [
    { to: '/control-room', icon: Map, label: 'Control Room' },
    { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { to: '/units', icon: Shield, label: 'Patrol Units' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/users', icon: Users, label: 'Users' },
  ],
  officer: [
    { to: '/officer', icon: Radio, label: 'My Assignments' },
  ],
  citizen: [
    { to: '/report', icon: AlertTriangle, label: 'Report Emergency' },
    { to: '/my-incidents', icon: LayoutDashboard, label: 'My Reports' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { connected, escalations } = useSocket();
  const navigate = useNavigate();

  const getSidebarHeader = () => {
    switch (user?.role) {
      case 'admin':
        return { text: 'Admin', sub: 'Control Center' };
      case 'dispatcher':
        return { text: 'Dispatcher', sub: 'Control Room' };
      case 'officer':
        return { text: 'Officer', sub: 'Terminal' };
      case 'citizen':
      default:
        return { text: 'Prakasam Police', sub: 'Services' };
    }
  };
  const header = getSidebarHeader();
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.citizen;

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none', border: '1.5px solid #ff9933', borderRadius: '50%', overflow: 'hidden' }}>
          <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="logo-text">{header.text}</div>
          <div className="logo-sub">{header.sub}</div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} className="nav-icon" />
            {label}
          </NavLink>
        ))}

        {escalations.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: '1rem' }}>
              Alerts
            </div>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255,109,0,0.1)',
              border: '1px solid rgba(255,109,0,0.3)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#ff8c00',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Bell size={14} />
              {escalations.length} escalation{escalations.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.7rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--accent-green)' : '#ff3b5c' }} />
          <span style={{ color: connected ? 'var(--accent-green)' : '#ff3b5c' }}>
            {connected ? 'Live Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="user-card" onClick={() => { logout(); navigate('/login'); }}>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
