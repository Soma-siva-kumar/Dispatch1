import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Radio, LogOut, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/officer', icon: Radio, label: 'My Assignments' },
  { to: '/previous-reports', icon: FileText, label: 'Previous Reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo" style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none', cursor: 'pointer' }}>
        <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none', border: '1.5px solid #ff9933', borderRadius: '50%', overflow: 'hidden' }}>
          <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="logo-text">Officer</div>
          <div className="logo-sub">Terminal</div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.7rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--accent-green)' : '#ff3b5c' }} />
          <span style={{ color: connected ? 'var(--accent-green)' : '#ff3b5c' }}>
            {connected ? 'Live Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="user-card" onClick={() => { logout(); navigate('/login'); }}>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-red), var(--accent-orange))' }}>
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
