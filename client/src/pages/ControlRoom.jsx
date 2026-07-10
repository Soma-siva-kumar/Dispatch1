import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { IncidentCard, PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import { AlertTriangle, Zap, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PRIORITY_COLORS = { P1: '#ff1744', P2: '#ff6d00', P3: '#ffd600', P4: '#00e676' };

function createIncidentIcon(priority) {
  const color = PRIORITY_COLORS[priority] || '#aaa';
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 0 12px ${color}80;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;animation:${priority === 'P1' ? 'pulse 1s infinite' : 'none'};
    ">🚨</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createUnitIcon(status) {
  const color = status === 'available' ? '#00d68f' : status === 'dispatched' ? '#4361ee' : '#ff8c00';
  return L.divIcon({
    html: `<div style="width:26px;height:26px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">🚔</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Hyderabad center
const MAP_CENTER = [17.3850, 78.4867];
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function ControlRoom() {
  const [incidents, setIncidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nearestUnits, setNearestUnits] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { onEvent, escalations, clearEscalation } = useSocket();

  const fetchData = async () => {
    try {
      const [inc, u] = await Promise.all([API.get('/incidents'), API.get('/units')]);
      setIncidents(inc.data);
      setUnits(u.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const cleanups = [
      onEvent('incident:new', ({ incident }) => {
        setIncidents(prev => [incident, ...prev]);
        toast(`🚨 New ${incident.priority} incident: ${incident.title}`, {
          style: { background: PRIORITY_COLORS[incident.priority] + '22', border: `1px solid ${PRIORITY_COLORS[incident.priority]}` }
        });
      }),
      onEvent('incident:update', ({ incident }) => {
        setIncidents(prev => prev.map(i => i._id === incident._id ? incident : i));
        setSelected(prev => prev?._id === incident._id ? incident : prev);
      }),
      onEvent('unit:position', ({ unitId, coordinates }) => {
        setUnits(prev => prev.map(u => u._id === unitId
          ? { ...u, location: { ...u.location, coordinates } }
          : u
        ));
      }),
      onEvent('unit:statusUpdate', ({ unit }) => {
        setUnits(prev => prev.map(u => u._id === unit._id ? unit : u));
      }),
    ];
    return () => cleanups.forEach(fn => fn?.());
  }, []);

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['resolved', 'cancelled'].includes(i.status);
    if (filter === 'pending') return i.status === 'pending';
    return i.priority === filter;
  });

  const handleSelect = async (incident) => {
    setSelected(incident);
    try {
      const { data } = await API.get(`/incidents/${incident._id}/nearest-units`);
      setNearestUnits(data);
    } catch { setNearestUnits([]); }
  };

  const handleDispatch = async (unitId) => {
    if (!selected) return;
    try {
      await API.post(`/incidents/${selected._id}/dispatch`, { unitId });
      toast.success('✅ Unit dispatched!');
      setSelected(null);
      setNearestUnits([]);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Dispatch failed');
    }
  };

  const handleAutoDispatch = async () => {
    if (!selected) return;
    try {
      await API.post(`/incidents/${selected._id}/dispatch`, {});
      toast.success('✅ Auto-dispatched nearest unit!');
      setSelected(null);
      setNearestUnits([]);
    } catch (e) {
      toast.error(e.response?.data?.message || 'No available units nearby');
    }
  };

  const handleStatusUpdate = async (incidentId, status) => {
    try {
      await API.patch(`/incidents/${incidentId}/status`, { status });
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const activeCount = incidents.filter(i => !['resolved', 'cancelled'].includes(i.status)).length;
  const p1Count = incidents.filter(i => i.priority === 'P1' && i.status !== 'resolved').length;

  return (
    <div className="app-layout">
      <Navbar title="Control Room" />
      <div className="main-content">
        <div style={{ padding: '1rem', height: 'calc(100vh - 64px)' }}>

          {/* Escalation Alerts */}
          {escalations.length > 0 && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {escalations.slice(0, 2).map((e, i) => (
                <div key={i} className={`escalation-alert ${e.severity}`}>
                  <AlertTriangle size={16} style={{ color: e.severity === 'high' ? 'var(--p1)' : 'var(--p2)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', flex: 1 }}>{e.message}</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => clearEscalation(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'active', 'pending', 'P1', 'P2', 'P3'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? `All (${incidents.length})` : f}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--p1)', fontWeight: 700 }}>🔴 P1: {p1Count}</span>
              <span style={{ color: 'var(--accent-blue)' }}>🟦 Active: {activeCount}</span>
              <span style={{ color: 'var(--accent-green)' }}>🟢 Units Available: {units.filter(u => u.status === 'available').length}</span>
            </div>
          </div>

          {/* Main Grid */}
          <div className="control-room" style={{ height: 'calc(100vh - 175px)' }}>
            {/* Left: Incident List */}
            <div className="control-room-sidebar">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {filteredIncidents.length} Incidents
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
              ) : (
                <div className="incident-list">
                  {filteredIncidents.map(inc => (
                    <IncidentCard
                      key={inc._id}
                      incident={inc}
                      onClick={handleSelect}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Map + Detail Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Map */}
              <div className="map-container" style={{ flex: 1 }}>
                <MapContainer
                  center={MAP_CENTER}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <ChangeView center={selected ? [selected.location.coordinates[1], selected.location.coordinates[0]] : MAP_CENTER} />
                  <TileLayer
                    url={OSM_TILE_URL}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />

                  {/* Incident Markers */}
                  {incidents.filter(i => i.status !== 'resolved').map(inc => (
                    inc.location?.coordinates && (
                      <Marker
                        key={inc._id}
                        position={[inc.location.coordinates[1], inc.location.coordinates[0]]}
                        icon={createIncidentIcon(inc.priority)}
                        eventHandlers={{ click: () => handleSelect(inc) }}
                      >
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <strong>{inc.title}</strong><br />
                            <span style={{ color: PRIORITY_COLORS[inc.priority] }}>Priority: {inc.priority}</span><br />
                            Status: {inc.status}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}

                  {/* P1 Danger Zone Circles (separate from Markers) */}
                  {incidents.filter(i => i.status !== 'resolved' && i.priority === 'P1' && i.location?.coordinates).map(inc => (
                    <Circle
                      key={`circle-${inc._id}`}
                      center={[inc.location.coordinates[1], inc.location.coordinates[0]]}
                      radius={300}
                      color={PRIORITY_COLORS.P1}
                      fillOpacity={0.05}
                    />
                  ))}

                  {/* Unit Markers */}
                  {units.map(unit => (
                    unit.location?.coordinates && (
                      <Marker
                        key={unit._id}
                        position={[unit.location.coordinates[1], unit.location.coordinates[0]]}
                        icon={createUnitIcon(unit.status)}
                      >
                        <Popup>
                          <div>
                            <strong>{unit.unitId}</strong><br />
                            {unit.officerName}<br />
                            Status: <span style={{ fontWeight: 700 }}>{unit.status}</span>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                </MapContainer>
              </div>

              {/* Incident Detail Panel */}
              {selected && (
                <div className="card" style={{ flexShrink: 0 }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PriorityBadge priority={selected.priority} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selected.title}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelected(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{selected.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <StatusBadge status={selected.status} />
                        {selected.weaponInvolved && <span className="badge badge-p1">⚠️ Weapon</span>}
                        {selected.location?.address && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            📍 {selected.location.address}
                            {selected.location.coordinates && (
                              <a
                                href={`https://maps.google.com/?q=${selected.location.coordinates[1]},${selected.location.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm"
                                style={{ marginLeft: '0.5rem', display: 'inline-flex', padding: '0.1rem 0.4rem', height: 'auto', fontSize: '0.7rem', textDecoration: 'underline' }}
                              >
                                Open in Maps
                              </a>
                            )}
                          </span>
                        )}
                      </div>
                      {selected.reportedBy && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Reporter Info: </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selected.reportedBy.name}</span>
                          {selected.reportedBy.email && (
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.6rem' }}>
                              ✉️ {selected.reportedBy.email}
                            </span>
                          )}
                          {selected.reportedBy.phone && (
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.6rem' }}>
                              📞 {selected.reportedBy.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {selected.status === 'pending' && (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={handleAutoDispatch}>
                            <Zap size={14} /> Auto-Dispatch
                          </button>
                        </>
                      )}
                      {selected.status === 'arrived' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(selected._id, 'resolved')}>
                          <CheckCircle size={14} /> Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nearest Units */}
                  {nearestUnits.length > 0 && selected.status === 'pending' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Nearest Available Units
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {nearestUnits.slice(0, 4).map(u => (
                          <button
                            key={u._id}
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDispatch(u._id)}
                            style={{ fontSize: '0.75rem' }}
                          >
                            🚔 {u.unitId} ({u.distanceKm?.toFixed(1)} km)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
