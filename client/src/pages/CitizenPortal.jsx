import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapPin, AlertTriangle, Send } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const INCIDENT_TYPES = [
  { value: 'assault', label: 'Assault', desc: 'Physical attack on a person' },
  { value: 'robbery', label: 'Robbery', desc: 'Theft with force or threat' },
  { value: 'shooting', label: 'Shooting', desc: 'Gunfire or gunshot wounds' },
  { value: 'accident', label: 'Accident', desc: 'Vehicle crash or collision' },
  { value: 'fire', label: 'Fire', desc: 'Building or vehicle fire' },
  { value: 'medical', label: 'Medical', desc: 'Medical emergency' },
  { value: 'domestic_violence', label: 'Domestic Violence', desc: 'Domestic abuse' },
  { value: 'theft', label: 'Theft', desc: 'Stolen property' },
  { value: 'vandalism', label: 'Vandalism', desc: 'Property damage' },
  { value: 'suspicious', label: 'Suspicious', desc: 'Suspicious activity' },
  { value: 'noise', label: 'Noise', desc: 'Noise disturbance' },
  { value: 'other', label: 'Other', desc: 'Other emergency' },
];

const MAP_CENTER = [17.3850, 78.4867];
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lng, e.latlng.lat]); } });
  return null;
}

export default function CitizenPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', type: '', weaponInvolved: false, peopleAffected: 1,
  });
  const [coords, setCoords] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [step, setStep] = useState(1); // 1=type, 2=details, 3=location

  const getGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords([pos.coords.longitude, pos.coords.latitude]); setGpsLoading(false); },
      () => {
        // Fallback: random Hyderabad coord
        setCoords([78.4867 + (Math.random() - 0.5) * 0.1, 17.3850 + (Math.random() - 0.5) * 0.08]);
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) return toast.error('Please pin your location on the map');
    if (!form.type) return toast.error('Please select incident type');
    setSubmitting(true);
    try {
      const { data } = await API.post('/incidents', { ...form, coordinates: coords, address: 'Hyderabad, Telangana' });
      setSubmitted(data);
      toast.success('🚨 Emergency reported! Help is on the way.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Report failed');
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--accent-green)', marginBottom: '0.5rem' }}>Report Received!</h2>
          <p style={{ marginBottom: '1.5rem' }}>Your emergency has been logged and dispatchers have been notified.</p>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Incident Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Priority Assigned</span>
              <span className={`badge badge-${submitted.priority?.toLowerCase()}`}>{submitted.priority}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>AI Score</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{submitted.score}/200</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</span>
              <span className="badge badge-pending">Pending Dispatch</span>
            </div>
          </div>

          {submitted.priority === 'P1' && (
            <div style={{ padding: '0.75rem', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#ff6b6b' }}>
              🚨 P1 Critical — A unit has been auto-dispatched to your location!
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setSubmitted(null); setForm({ title: '', description: '', type: '', weaponInvolved: false, peopleAffected: 1 }); setCoords(null); setStep(1); }}>
              Report Another
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/my-incidents')}>
              Track My Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚨</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Report Emergency</h1>
          <p>Fill the form below. Help will be dispatched immediately.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {['Incident Type', 'Details', 'Location'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step > i + 1 ? 'var(--accent-green)' : step === i + 1 ? 'var(--accent-blue)' : 'var(--bg-glass)',
                border: `1px solid ${step >= i + 1 ? 'transparent' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: 'white',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.8rem', color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              {i < 2 && <div style={{ width: 40, height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Incident Type */}
          {step === 1 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>What type of emergency is this?</h3>
              <div className="grid-auto">
                {INCIDENT_TYPES.map(t => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => { setForm(f => ({ ...f, type: t.value })); }}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `1px solid ${form.type === t.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                      background: form.type === t.value ? 'rgba(67,97,238,0.15)' : 'var(--bg-glass)',
                      color: form.type === t.value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t.label.split(' ')[0]}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.label.split(' ').slice(1).join(' ')}</div>
                    <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" disabled={!form.type} onClick={() => setStep(2)}>
                  Next: Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Describe what's happening</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Incident Title *</label>
                  <input className="form-input" placeholder="Brief title e.g. Armed robbery at ATM" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" placeholder="Describe what you see. Include details like weapons, number of people, injuries..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">People Affected</label>
                    <input type="number" className="form-input" min={0} max={100} value={form.peopleAffected} onChange={e => setForm(f => ({ ...f, peopleAffected: parseInt(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weapon Involved?</label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="weapon" checked={form.weaponInvolved} onChange={() => setForm(f => ({ ...f, weaponInvolved: true }))} /> Yes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="radio" name="weapon" checked={!form.weaponInvolved} onChange={() => setForm(f => ({ ...f, weaponInvolved: false }))} /> No
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary" disabled={!form.title || !form.description} onClick={() => setStep(3)}>
                  Next: Location →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>Pin Your Location</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Click on the map to drop a pin, or use GPS.</p>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={getGPS} disabled={gpsLoading}>
                  <MapPin size={16} /> {gpsLoading ? 'Getting GPS...' : 'Use My GPS Location'}
                </button>
                {coords && <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', alignSelf: 'center' }}>✓ Location set ({coords[1].toFixed(4)}, {coords[0].toFixed(4)})</span>}
              </div>

              <div className="map-container" style={{ height: 350 }}>
                <MapContainer center={coords ? [coords[1], coords[0]] : deviceLocation ? [deviceLocation[1], deviceLocation[0]] : MAP_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url={OSM_TILE_URL} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} />
                  <LocationPicker onPick={setCoords} />
                  {deviceLocation && (
                    <Marker position={[deviceLocation[1], deviceLocation[0]]} icon={L.divIcon({ html: '<div style="width:22px;height:22px;border-radius:50%;background:#2196f3;border:3px solid white;box-shadow:0 0 12px rgba(33,150,243,0.55);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;">•</div>', className: '', iconSize: [22, 22], iconAnchor: [11, 11] })}>
                    </Marker>
                  )}
                  {coords && <Marker position={[coords[1], coords[0]]} icon={L.divIcon({ html: '<div style="width:32px;height:32px;border-radius:50%;background:#ff1744;border:3px solid white;box-shadow:0 0 15px #ff174480;display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>', className: '', iconSize: [32, 32], iconAnchor: [16, 16] })} />}
                </MapContainer>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn btn-danger btn-lg" disabled={submitting || !coords}>
                  <Send size={18} /> {submitting ? 'Sending...' : '🚨 Send Emergency Report'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
