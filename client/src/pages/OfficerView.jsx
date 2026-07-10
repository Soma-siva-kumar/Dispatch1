import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MapPin, Radio, CheckCircle, Clock, Navigation } from 'lucide-react';

export default function OfficerView() {
  const { user } = useAuth();
  const { joinUnitRoom, emitAck, onEvent } = useSocket();
  const [myUnit, setMyUnit] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [myIncidents, setMyIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadData();
    // Listen for incoming dispatches
    const cleanup = onEvent('unit:dispatch', ({ incident, message }) => {
      setAssignment(incident);
      toast(`📟 ${message}`, { duration: 8000, style: { background: 'rgba(255,23,68,0.2)', border: '1px solid #ff1744' } });
    });
    return cleanup;
  }, []);

  const loadData = async () => {
    try {
      const [me, units] = await Promise.all([API.get('/auth/me'), API.get('/units')]);
      const userInfo = me.data;
      // Find this officer's unit
      const unit = units.data.find(u => u.assignedOfficer?._id === userInfo._id || u.assignedOfficer === userInfo._id);
      if (unit) {
        setMyUnit(unit);
        joinUnitRoom(unit._id);
        // Load current assignment
        if (unit.currentIncident) {
          const { data } = await API.get(`/incidents/${unit.currentIncident._id || unit.currentIncident}`);
          setAssignment(data);
        }
      }
      // Load resolved incidents
      const resolved = await API.get('/incidents', { params: { limit: 20 } });
      setMyIncidents(resolved.data.filter(i => i.assignedUnit?._id === unit?._id));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const handleAck = () => {
    if (!assignment || !myUnit) return;
    emitAck(assignment._id, myUnit._id);
    setAssignment(prev => ({ ...prev, status: 'en_route' }));
    toast.success('✅ Acknowledged — en route!');
  };

  const handleStatusUpdate = async (status) => {
    if (!assignment) return;
    setStatusUpdating(true);
    try {
      const { data } = await API.patch(`/incidents/${assignment._id}/status`, { status });
      setAssignment(data);
      if (status === 'arrived') toast.success('📍 Arrived at scene!');
      if (status === 'resolved') {
        toast.success('✅ Incident resolved!');
        setAssignment(null);
        if (myUnit) {
          await API.patch(`/units/${myUnit._id}/status`, { status: 'available' });
          setMyUnit(prev => ({ ...prev, status: 'available', currentIncident: null }));
        }
      }
    } catch { toast.error('Update failed'); }
    finally { setStatusUpdating(false); }
  };

  const broadcastLocation = () => {
    if (!myUnit) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = [pos.coords.longitude, pos.coords.latitude];
      API.patch(`/units/${myUnit._id}/location`, { coordinates: coords });
      toast.success('📡 Location broadcast!');
    }, () => toast.error('GPS unavailable'));
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading assignments...</p></div>;

  return (
    <div className="app-layout">
      <Navbar title="Officer View" />
      <div className="main-content">
        <div className="page-container">
          <div style={{ maxWidth: 700 }}>

            {/* Unit Status Card */}
            {myUnit ? (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                  <div className="card-title"><Radio size={16} /> My Unit</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge badge-${myUnit.status}`}>{myUnit.status}</span>
                    <button className="btn btn-ghost btn-sm" onClick={broadcastLocation}>
                      <Navigation size={14} /> Broadcast Location
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{myUnit.unitId}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{myUnit.officerName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zone</div>
                    <div style={{ fontWeight: 600 }}>{myUnit.zone || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Dispatches</div>
                    <div style={{ fontWeight: 600 }}>{myUnit.totalDispatches}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1rem' }}>
                <p>No patrol unit assigned to your account yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Contact admin to assign you to a unit.</p>
              </div>
            )}

            {/* Active Assignment */}
            {assignment && (
              <div className="card" style={{
                marginBottom: '1rem',
                border: `1px solid ${assignment.priority === 'P1' ? 'rgba(255,23,68,0.5)' : 'var(--border)'}`,
                background: assignment.priority === 'P1' ? 'rgba(255,23,68,0.05)' : 'var(--bg-card)',
              }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🚨</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Active Assignment</span>
                  </div>
                  <PriorityBadge priority={assignment.priority} />
                </div>

                <h3 style={{ marginBottom: '0.5rem' }}>{assignment.title}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{assignment.description}</p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <StatusBadge status={assignment.status} />
                  {assignment.weaponInvolved && <span className="badge badge-p1">⚠️ Weapon Reported</span>}
                  {assignment.peopleAffected > 1 && <span className="badge badge-p2">👥 {assignment.peopleAffected} people affected</span>}
                </div>

                {assignment.location?.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={15} /> {assignment.location.address}
                    {assignment.location.coordinates && (
                      <a
                        href={`https://maps.google.com/?q=${assignment.location.coordinates[1]},${assignment.location.coordinates[0]}`}
                        target="_blank" rel="noopener"
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Open in Maps
                      </a>
                    )}
                  </div>
                )}

                {assignment.reportedBy && (
                  <div style={{
                    marginTop: '0.5rem',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Reporter Information</div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Name:</strong> {assignment.reportedBy.name}<br />
                      <strong>Email:</strong> {assignment.reportedBy.email || '—'}<br />
                      <strong>Phone:</strong> {assignment.reportedBy.phone || '—'}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {assignment.status === 'dispatched' && (
                    <button className="btn btn-primary" onClick={handleAck} disabled={statusUpdating}>
                      <Navigation size={16} /> Acknowledge & Go En Route
                    </button>
                  )}
                  {assignment.status === 'en_route' && (
                    <button className="btn btn-success" onClick={() => handleStatusUpdate('arrived')} disabled={statusUpdating}>
                      <CheckCircle size={16} /> I've Arrived at Scene
                    </button>
                  )}
                  {assignment.status === 'arrived' && (
                    <button className="btn btn-success" onClick={() => handleStatusUpdate('resolved')} disabled={statusUpdating}>
                      <CheckCircle size={16} /> Mark as Resolved
                    </button>
                  )}
                  {assignment.status === 'resolved' && (
                    <span style={{ color: 'var(--accent-green)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={16} /> Incident Resolved
                    </span>
                  )}
                </div>

                {/* Timeline */}
                {assignment.timeline?.length > 0 && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Timeline</div>
                    <div className="timeline">
                      {assignment.timeline.slice(-4).reverse().map((t, i) => (
                        <div key={i} className="timeline-item">
                          <div className={`timeline-dot ${i === 0 ? 'active' : ''}`} />
                          <div className="timeline-content">
                            <div className="timeline-title">{t.note || t.status}</div>
                            <div className="timeline-time">{new Date(t.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!assignment && myUnit && (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1rem', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🟢</div>
                <h3 style={{ color: 'var(--accent-green)' }}>Available for Dispatch</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>You'll receive an alert when you're dispatched to an incident.</p>
              </div>
            )}

            {/* Past Incidents */}
            {myIncidents.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><Clock size={16} /> My Recent Incidents</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {myIncidents.slice(0, 5).map(inc => (
                    <div key={inc._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <PriorityBadge priority={inc.priority} />
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{inc.title}</span>
                      <StatusBadge status={inc.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
