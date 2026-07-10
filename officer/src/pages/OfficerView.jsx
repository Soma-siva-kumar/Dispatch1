import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import IncidentImageGallery from '../components/IncidentImageGallery';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MapPin, Radio, CheckCircle, Clock, Navigation, LocateFixed, Loader } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MAP_CENTER = [15.5057, 80.0499];
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 14);
    }
  }, [center, map]);
  return null;
}

export default function OfficerView() {
  const { user } = useAuth();
  const { joinUnitRoom, emitAck, onEvent } = useSocket();
  const [myUnit, setMyUnit] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [myIncidents, setMyIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null); // [lng, lat]
  const [mapCenterOverride, setMapCenterOverride] = useState(null); // [lat, lng]

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setDeviceLocation(coords);
        if (myUnit) {
          setMyUnit(prev => prev ? ({
            ...prev,
            location: { ...prev.location, coordinates: coords },
          }) : prev);
          API.patch(`/units/${myUnit._id}/location`, { coordinates: coords }).catch(console.error);
        }
      },
      err => console.warn('Geolocation watch error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [myUnit?._id]);

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
      setDeviceLocation(coords);
      API.patch(`/units/${myUnit._id}/location`, { coordinates: coords });
      toast.success('📡 Location broadcast!');
    }, () => toast.error('GPS unavailable'));
  };

  const refreshOfficerLocation = () => {
    if (!myUnit) return;
    if (!navigator.geolocation) {
      toast.error('GPS unavailable');
      return;
    }

    setLocationUpdating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = [pos.coords.longitude, pos.coords.latitude];
      try {
        const { data } = await API.patch(`/units/${myUnit._id}/location`, { coordinates: coords });
        setDeviceLocation(coords);
        setMyUnit(prev => ({
          ...(data || prev),
          location: { ...(data?.location || prev?.location), coordinates: coords },
        }));
        setMapCenterOverride([coords[1], coords[0]]);
        toast.success('Current location updated');
      } catch {
        toast.error('Location update failed');
      } finally {
        setLocationUpdating(false);
      }
    }, () => {
      setLocationUpdating(false);
      toast.error('GPS unavailable');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading assignments...</p></div>;

  const officerMapCoordinates = deviceLocation || myUnit?.location?.coordinates;
  const mapCenter = mapCenterOverride || (assignment?.location?.coordinates
    ? [assignment.location.coordinates[1], assignment.location.coordinates[0]]
    : officerMapCoordinates
      ? [officerMapCoordinates[1], officerMapCoordinates[0]]
      : myUnit?.location?.coordinates
        ? [myUnit.location.coordinates[1], myUnit.location.coordinates[0]]
        : MAP_CENTER);

  return (
    <div className="app-layout">
      <Navbar title="Officer View" />
      <div className="main-content">
        <div className="page-container">
          <style>{`
            @media (min-width: 992px) {
              .grid-2-resp {
                grid-template-columns: 1.2fr 1fr;
              }
            }
            @media (max-width: 991px) {
              .grid-2-resp {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
          
          <div className="grid-2-resp" style={{ display: 'grid', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Left Column - Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Unit Status Card */}
              {myUnit ? (
                <div className="card" style={{ marginBottom: '0' }}>
                  <div className="card-header">
                    <div className="card-title"><Radio size={16} /> My Unit</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className={`badge badge-${myUnit.status}`}>{myUnit.status}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={refreshOfficerLocation}
                        disabled={locationUpdating}
                        title="Refresh and update current location"
                      >
                        {locationUpdating ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LocateFixed size={14} />}
                        {locationUpdating ? 'Updating...' : 'Refresh Location'}
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
                <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '0' }}>
                  <p>No patrol unit assigned to your account yet.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Contact admin to assign you to a unit.</p>
                </div>
              )}

              {/* Active Assignment */}
              {assignment && (
                <div className="card" style={{
                  marginBottom: '0',
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

                  {/* Incident Images */}
                  {assignment.images && assignment.images.length > 0 && (
                    <div style={{ marginTop: '0.75rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <IncidentImageGallery images={assignment.images} />
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
                <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '0', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🟢</div>
                  <h3 style={{ color: 'var(--accent-green)' }}>Available for Dispatch</h3>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>You'll receive an alert when you're dispatched to an incident.</p>
                </div>
              )}

              {/* Past Incidents */}
              {myIncidents.length > 0 && (
                <div className="card" style={{ marginBottom: '0' }}>
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

            {/* Right Column - Map */}
            <div className="card" style={{ padding: '1.5rem', height: 'calc(100vh - 120px)', position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', marginBottom: '0' }}>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <div className="card-title"><MapPin size={16} /> Live Incident Map</div>
              </div>
              <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <ChangeView center={mapCenter} />
                  <TileLayer
                    url={OSM_TILE_URL}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />
                  {officerMapCoordinates && (
                    <Marker
                      position={[officerMapCoordinates[1], officerMapCoordinates[0]]}
                      icon={L.divIcon({
                        html: '<div style="width:28px;height:28px;border-radius:50%;background:#00d68f;border:3px solid white;box-shadow:0 0 12px rgba(0,214,143,0.55);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;">🚔</div>',
                        className: '', iconSize: [28, 28], iconAnchor: [14, 14]
                      })}
                    >
                      <Popup>
                        <div style={{ color: '#000' }}>
                          <strong>Your Unit ({myUnit?.unitId})</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Officer: {myUnit?.officerName}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                            Location: {officerMapCoordinates[1].toFixed(5)}, {officerMapCoordinates[0].toFixed(5)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {assignment?.location?.coordinates && (
                    <Marker
                      position={[assignment.location.coordinates[1], assignment.location.coordinates[0]]}
                      icon={L.divIcon({
                        html: `<div style="width:34px;height:34px;border-radius:50%;background:#ff1744;border:3px solid white;box-shadow:0 0 16px rgba(255,23,68,0.7);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;animation:${assignment.priority === 'P1' ? 'pulse 1s infinite' : 'none'};">🚨</div>`,
                        className: '', iconSize: [34, 34], iconAnchor: [17, 17]
                      })}
                    >
                      <Popup>
                        <div style={{ color: '#000' }}>
                          <strong>{assignment.title}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>{assignment.location.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
