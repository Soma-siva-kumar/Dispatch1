import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CarFront, CheckCircle2, CheckCheck, Clock, MapPin, Siren, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationIcon({ type }) {
  if (type === 'dispatch_assignment') return <CarFront size={18} />;
  if (type === 'new_incident') return <Siren size={18} />;
  return <Bell size={18} />;
}

export default function NotificationBell() {
  const {
    notifications,
    notificationPulse,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useSocket();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification._id);
    }
  };

  return (
    <div className="notification-shell" ref={wrapRef}>
      <button
        className={`notification-bell ${notificationPulse ? 'is-alerting' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        title="Notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className={`notification-badge ${notificationPulse ? 'is-pulsing' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <aside className="notification-panel">
          <div className="notification-panel-header">
            <div>
              <div className="notification-panel-title">Notifications</div>
              <div className="notification-panel-subtitle">{unreadCount} unread</div>
            </div>
            <div className="notification-panel-actions">
              <button className="notification-action" onClick={markAllNotificationsRead} title="Mark all as read">
                <CheckCheck size={15} />
              </button>
              <button className="notification-action danger" onClick={clearNotifications} title="Clear all notifications">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet.</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  role="button"
                  tabIndex={0}
                  className={`notification-card ${notification.read ? 'is-read' : 'is-unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <span className="notification-card-icon">
                    <NotificationIcon type={notification.type} />
                  </span>
                  <span className="notification-card-body">
                    <span className="notification-card-topline">
                      <span className="notification-card-title">{notification.title}</span>
                      <span className="notification-read-dot" />
                    </span>
                    <span className="notification-card-message">{notification.message}</span>
                    <span className="notification-meta-grid">
                      {notification.metadata?.incidentId && <span>ID: {notification.metadata.incidentId.slice(-6).toUpperCase()}</span>}
                      {notification.metadata?.incidentType && <span>Type: {notification.metadata.incidentType.replaceAll('_', ' ')}</span>}
                      {notification.metadata?.priority && <span>Priority: {notification.metadata.priority}</span>}
                      {notification.metadata?.dispatcherName && <span>Dispatcher: {notification.metadata.dispatcherName}</span>}
                      {notification.metadata?.location && (
                        <span className="notification-location"><MapPin size={12} /> {notification.metadata.location}</span>
                      )}
                    </span>
                    <span className="notification-card-time">
                      <Clock size={12} />
                      {formatTime(notification.metadata?.assignedTime || notification.metadata?.reportTime || notification.createdAt)}
                    </span>
                  </span>
                  {!notification.read && (
                    <button
                      className="notification-mark-read"
                      onClick={(event) => {
                        event.stopPropagation();
                        markNotificationRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
