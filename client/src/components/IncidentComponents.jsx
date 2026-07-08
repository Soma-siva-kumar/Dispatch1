const PRIORITY_COLORS = { P1: '#ff1744', P2: '#ff6d00', P3: '#ffd600', P4: '#00e676' };
const PRIORITY_BG = { P1: 'rgba(255,23,68,0.15)', P2: 'rgba(255,109,0,0.15)', P3: 'rgba(255,214,0,0.1)', P4: 'rgba(0,230,118,0.1)' };

const TYPE_ICONS = {
  assault: '👊', robbery: '🔫', shooting: '💥', accident: '🚗',
  fire: '🔥', medical: '🚑', domestic_violence: '⚠️', theft: '🕵️',
  vandalism: '🪨', suspicious: '👁️', noise: '📢', other: '🚨',
};

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge-${priority?.toLowerCase()}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const label = status?.replace('_', ' ');
  return (
    <span className={`badge badge-${status}`}>
      {label}
    </span>
  );
}

export function IncidentCard({ incident, onClick, compact = false }) {
  const { priority, type, title, status, createdAt, location } = incident;
  const icon = TYPE_ICONS[type] || '🚨';
  const pColor = PRIORITY_COLORS[priority] || '#aaa';
  const pBg = PRIORITY_BG[priority] || 'rgba(100,100,100,0.1)';

  return (
    <div
      className={`incident-item ${priority?.toLowerCase()}`}
      onClick={() => onClick?.(incident)}
    >
      <div
        className="incident-icon"
        style={{ background: pBg }}
      >
        {icon}
      </div>
      <div className="incident-meta">
        <div className="incident-title">{title}</div>
        <div className="incident-sub">
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
          {!compact && location?.address && (
            <span>📍 {location.address}</span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            {new Date(createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'blue', sub }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{sub}</div>}
      </div>
    </div>
  );
}
