import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, AlertTriangle, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { to: '/report',        icon: AlertTriangle,  label: t('portal.submitIncidentBtn') },
    { to: '/my-incidents',  icon: LayoutDashboard, label: t('myIncidents.incDashboard') },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        <div className="logo-icon">
          <img
            src="/prakasam_police_badge.jpg"
            alt="Prakasam Police Badge"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div>
          <div className="logo-text">{t('common.prakasamPolice')}</div>
          <div className="logo-sub">{t('common.citizenPortal')}</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{t('common.navigation')}</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Connection status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '0.875rem',
          padding: '0.4rem 0.6rem',
          background: connected ? 'rgba(19,136,8,0.1)' : 'rgba(255,59,92,0.1)',
          border: `1px solid ${connected ? 'rgba(19,136,8,0.3)' : 'rgba(255,59,92,0.3)'}`,
          borderRadius: '999px',
          fontSize: '0.68rem',
          fontWeight: 600,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? 'var(--flag-green-l)' : '#ff3b5c',
            boxShadow: connected ? '0 0 6px var(--flag-green-l)' : '0 0 6px #ff3b5c',
            animation: 'pulse-live 1.6s infinite',
          }} />
          <span style={{ color: connected ? 'var(--flag-green-l)' : '#ff3b5c' }}>
            {connected ? t('navbar.liveConnected') : t('navbar.disconnected')}
          </span>
        </div>

        {/* User logout card */}
        <div
          className="user-card"
          style={{ cursor: 'pointer' }}
          onClick={() => { logout(); navigate('/login'); }}
          title={t('navbar.clickToLogout')}
        >
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">
              {user?.role === 'citizen' ? t('navbar.citizen') : user?.role}
            </div>
          </div>
          <LogOut size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.7 }} />
        </div>
      </div>
    </aside>
  );
}
