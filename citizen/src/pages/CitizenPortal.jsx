import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { MapPin, Send, LocateFixed, RefreshCw, ShieldAlert, FileText, MapPinned, Camera } from 'lucide-react';
import Navbar from '../components/Navbar';
import ImageUploader from '../components/ImageUploader';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MAP_CENTER = [15.5057, 80.0499];
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const GPS_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 };

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick([e.latlng.lng, e.latlng.lat]); } });
  return null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 16);
    }
  }, [center, map]);
  return null;
}

async function reverseGeocode(lat, lng, lang) {
  try {
    const locale = lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en';
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': locale } }
    );
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.village,
      a.city || a.town || a.county,
      a.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function CitizenPortal() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', type: '', weaponInvolved: false, peopleAffected: 1,
  });
  const [imageFiles, setImageFiles] = useState([]); // { file, preview, id }[]
  const [coords, setCoords] = useState(null);   // [lng, lat]
  const [deviceLocation, setDeviceLocation] = useState(null); // current device GPS location
  const [address, setAddress] = useState('');   // human-readable reverse geocoded address
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [step, setStep] = useState(1);
  const geocodeTimer = useRef(null);

  const portalStyles = (
    <style>{`
      .report-portal-wrapper {
        --text-shadow-subtle: 0 1px 3px rgba(0,0,0,0.35);
      }
      .report-portal-wrapper h1 {
        color: #FFFFFF !important;
        text-shadow: var(--text-shadow-subtle) !important;
        -webkit-text-fill-color: initial !important;
        background: none !important;
      }
      .report-portal-wrapper h2 {
        color: #FFFFFF !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper h3 {
        color: #F8FAFC !important;
        font-weight: 700 !important;
        font-size: 1.4rem !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper p, 
      .report-portal-wrapper .instruction-text {
        color: rgba(255,255,255,0.80) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .form-label {
        color: rgba(255,255,255,0.92) !important;
        text-shadow: var(--text-shadow-subtle) !important;
        font-weight: 600 !important;
      }
      .report-portal-wrapper .required-star {
        color: #FF6B6B !important;
        font-weight: 700 !important;
      }
      .report-portal-wrapper .form-input,
      .report-portal-wrapper .form-textarea,
      .report-portal-wrapper .form-select {
        color: #FFFFFF !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .form-input::placeholder,
      .report-portal-wrapper .form-textarea::placeholder {
        color: rgba(255, 255, 255, 0.65) !important;
      }
      .report-portal-wrapper .form-input:focus,
      .report-portal-wrapper .form-textarea:focus,
      .report-portal-wrapper .form-select:focus {
        border-color: rgba(255, 255, 255, 0.6) !important;
        background: rgba(255, 255, 255, 0.12) !important;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.15) !important;
      }
      .report-portal-wrapper .form-input:disabled {
        color: rgba(255, 255, 255, 0.5) !important;
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
      .report-portal-wrapper .incident-type-btn {
        padding: 1.5rem 1.25rem !important;
        border-radius: 16px !important;
        border: 1.5px solid rgba(255,255,255,0.18) !important;
        background: rgba(255, 255, 255, 0.04) !important;
        color: rgba(255,255,255,0.85) !important;
        transition: all 0.25s ease !important;
        text-align: left !important;
        cursor: pointer !important;
      }
      .report-portal-wrapper .incident-type-btn:hover {
        border-color: rgba(255,255,255,0.45) !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }
      .report-portal-wrapper .incident-type-btn.selected {
        border-color: #FF9933 !important;
        background: rgba(255, 153, 51, 0.16) !important;
        color: #FFFFFF !important;
        box-shadow: 0 4px 20px rgba(255, 153, 51, 0.3) !important;
      }
      .report-portal-wrapper .incident-type-btn .btn-desc {
        color: rgba(255, 255, 255, 0.72) !important;
      }
      .report-portal-wrapper .incident-type-btn.selected .btn-desc {
        color: rgba(255, 255, 255, 0.9) !important;
      }
      .report-portal-wrapper .btn-ghost {
        color: #FFFFFF !important;
        border-color: rgba(255,255,255,0.3) !important;
        background: rgba(255,255,255,0.06) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .btn-ghost:hover {
        background: rgba(255,255,255,0.12) !important;
        border-color: rgba(255,255,255,0.5) !important;
      }
      .report-portal-wrapper .btn-primary {
        color: #FFFFFF !important;
        border-color: rgba(255,153,51,0.5) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .btn-danger {
        color: #FFFFFF !important;
        border-color: rgba(255,59,92,0.5) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .info-text {
        color: rgba(255,255,255,0.78) !important;
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .gps-status-bar {
        text-shadow: var(--text-shadow-subtle) !important;
      }
      .report-portal-wrapper .error-message {
        color: #FF8080 !important;
      }
      .report-portal-wrapper .success-message {
        color: #4ADE80 !important;
      }
      .report-portal-wrapper .card {
        margin-bottom: 2rem !important;
      }
    `}</style>
  );

  const incidentTypes = [
    { value: 'assault', label: t('types.assault'), desc: t('typesDesc.assault') },
    { value: 'robbery', label: t('types.robbery'), desc: t('typesDesc.robbery') },
    { value: 'shooting', label: t('types.shooting'), desc: t('typesDesc.shooting') },
    { value: 'accident', label: t('types.accident'), desc: t('typesDesc.accident') },
    { value: 'fire', label: t('types.fire'), desc: t('typesDesc.fire') },
    { value: 'medical', label: t('types.medical'), desc: t('typesDesc.medical') },
    { value: 'domestic_violence', label: t('types.domestic_violence'), desc: t('typesDesc.domestic_violence') },
    { value: 'theft', label: t('types.theft'), desc: t('typesDesc.theft') },
    { value: 'vandalism', label: t('types.vandalism'), desc: t('typesDesc.vandalism') },
    { value: 'suspicious', label: t('types.suspicious'), desc: t('typesDesc.suspicious') },
    { value: 'noise', label: t('types.noise'), desc: t('typesDesc.noise') },
    { value: 'other', label: t('types.other'), desc: t('typesDesc.other') },
  ];

  const applyCoords = useCallback(([lng, lat]) => {
    setCoords([lng, lat]);
    setAddress(t('portal.fetchingAddress'));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng, lang);
      setAddress(addr);
    }, 400);
  }, [lang, t]);

  const getGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError(t('portal.gpsUnsupported'));
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLoading(false);
        const location = [pos.coords.longitude, pos.coords.latitude];
        setDeviceLocation(location);
        applyCoords(location);
        toast.success(`📍 ${t('portal.gpsCaptured')}!`);
      },
      err => {
        setGpsLoading(false);
        let msg = t('portal.gpsPinHint');
        if (err.code === 1) msg = t('portal.gpsDenied');
        if (err.code === 3) msg = t('portal.gpsTimeout');
        setGpsError(msg);
        toast.error(t('portal.gpsPinHint'));
      },
      GPS_OPTIONS
    );
  }, [applyCoords, t]);

  useEffect(() => {
    if (step === 3 && !coords) {
      getGPS();
    }
  }, [step, coords, getGPS]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) return toast.error(t('portal.validationLocation'));
    if (!form.type) return toast.error(t('portal.validationTitle'));
    setSubmitting(true);
    try {
      // Build FormData so images can be uploaded as multipart
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      fd.append('weaponInvolved', String(form.weaponInvolved));
      fd.append('peopleAffected', String(form.peopleAffected));
      fd.append('coordinates', JSON.stringify(coords));
      fd.append('address', address && !address.startsWith(t('portal.fetchingAddress').slice(0, 5)) ? address : `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`);
      imageFiles.forEach(item => fd.append('images', item.file));

      const { data } = await API.post('/incidents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(data);
      // Revoke object URLs
      imageFiles.forEach(item => URL.revokeObjectURL(item.preview));
      toast.success(t('portal.successTitle'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('portal.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setForm({ title: '', description: '', type: '', weaponInvolved: false, peopleAffected: 1 });
    setImageFiles([]);
    setCoords(null);
    setAddress('');
    setGpsError('');
    setStep(1);
  };

  if (submitted) {
    return (
      <div className="report-portal-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {portalStyles}
        <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 10px rgba(19, 136, 8, 0.4))' }}>✅</div>
          <h2 style={{ color: '#4ADE80', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem' }}>{t('portal.successTitle')}</h2>
          <p style={{ marginBottom: '1.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>{t('portal.successDesc')}</p>

          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.75rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', color: '#FF9933', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{t('portal.incidentSummary')}</div>
            {address && !address.startsWith(t('portal.fetchingAddress').slice(0, 5)) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', gap: '1.2rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', flexShrink: 0 }}>📍 {t('portal.locationLabel')}</span>
                <span style={{ fontSize: '0.82rem', color: '#FFFFFF', textAlign: 'right', fontWeight: 500 }}>{address}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>{t('portal.priorityLabel')}</span>
              <span className={`badge badge-${submitted.priority?.toLowerCase()}`}>{t(`priority.${submitted.priority}`)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>{t('portal.priorityScore')}</span>
              <span style={{ fontFamily: 'monospace', color: '#FF9933', fontWeight: 600 }}>{submitted.score}/200</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>{t('portal.statusLabel')}</span>
              <span className="badge badge-pending">{t('portal.awaitingDispatch')}</span>
            </div>
          </div>

          {submitted.priority === 'P1' && (
            <div style={{ padding: '0.85rem', background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.25)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#FF8080', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <span>🚨</span> {t('portal.p1AutoDispatched')}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={resetForm}>{t('portal.reportAnother')}</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/my-incidents')}>{t('portal.trackStatus')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar title={t('portal.reportTitle')} />
      <div className="report-portal-wrapper" style={{ padding: '2rem 1.5rem', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        {portalStyles}
        <div style={{ maxWidth: 880, margin: '0 auto' }} className="fade-in-up">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              padding: '0.5rem 1rem',
              background: 'rgba(255,153,51,0.1)',
              border: '1px solid rgba(255,153,51,0.25)',
              borderRadius: '999px',
              color: 'var(--flag-saffron)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <ShieldAlert size={14} /> {t('portal.emergencyDispatchGrid')}
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              fontFamily: "'Outfit', sans-serif",
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #fff, #9ca8c0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {t('portal.reportTitle')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '0.9rem' }}>
              {t('portal.reportDescText')}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', maxWidth: 460, margin: '0 auto 2.5rem' }}>
            {[
              { label: t('portal.stepCategory'), icon: ShieldAlert },
              { label: t('portal.stepDescribe'), icon: FileText },
              { label: t('portal.stepLocation'), icon: MapPinned },
            ].map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? '1' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div className={`step-dot ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: step === i + 1 ? '700' : '500',
                    color: step === i + 1 ? 'var(--flag-saffron)' : 'var(--text-muted)',
                    position: 'absolute',
                    top: '38px',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`step-line ${step > i + 1 ? 'done' : ''}`} style={{ margin: '0 0.5rem' }} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            {/* Step 1: Incident Type */}
            {step === 1 && (
              <div className="card fade-in-up" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {t('portal.stepCategory')}
                </h3>
                <div className="grid-auto" style={{ gap: '1rem' }}>
                  {incidentTypes.map(t => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={`incident-type-btn ${form.type === t.value ? 'selected' : ''}`}
                    >
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>{t.label}</div>
                      <div className="btn-desc" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn btn-primary btn-lg" disabled={!form.type} onClick={() => setStep(2)}>
                    {t('portal.btnNextDetails')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="card fade-in-up" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {t('portal.stepDescribe')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('portal.incidentTitleLabel')} <span className="required-star">*</span></label>
                    <input
                      className="form-input"
                      placeholder={t('portal.incidentTitlePlaceholder')}
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('portal.descriptionLabel')} <span className="required-star">*</span></label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '120px' }}
                      placeholder={t('portal.descriptionPlaceholder')}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Camera size={14} /> Upload Images <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>(Optional · up to 5)</span>
                    </label>
                    <ImageUploader
                      files={imageFiles}
                      onChange={setImageFiles}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">{t('portal.peopleLabel')}</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        max={100}
                        value={form.peopleAffected}
                        onChange={e => setForm(f => ({ ...f, peopleAffected: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('portal.weaponLabel')}</label>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="weapon"
                            style={{ accentColor: 'var(--flag-saffron)' }}
                            checked={form.weaponInvolved}
                            onChange={() => setForm(f => ({ ...f, weaponInvolved: true }))}
                          /> {t('common.yes')}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="weapon"
                            style={{ accentColor: 'var(--flag-saffron)' }}
                            checked={!form.weaponInvolved}
                            onChange={() => setForm(f => ({ ...f, weaponInvolved: false }))}
                          /> {t('common.no')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← {t('common.cancel')}</button>
                  <button type="button" className="btn btn-primary btn-lg" disabled={!form.title || !form.description} onClick={() => setStep(3)}>
                    {t('portal.btnNextLocation')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="card fade-in-up" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {t('portal.stepLocation')}
                </h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                  {t('portal.gpsInstructions')}
                </p>

                {/* GPS Status Bar */}
                <div className="gps-status-bar" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                  background: gpsLoading
                    ? 'rgba(255,153,51,0.06)'
                    : coords
                      ? 'rgba(19,136,8,0.06)'
                      : 'rgba(255,59,92,0.06)',
                  border: '1px solid',
                  borderColor: gpsLoading
                    ? 'rgba(255,153,51,0.2)'
                    : coords
                      ? 'rgba(19,136,8,0.2)'
                      : 'rgba(255,59,92,0.2)',
                }}>
                  {gpsLoading ? (
                    <>
                      <RefreshCw size={16} style={{ color: '#FFB347', animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', color: '#FFB347', fontWeight: 700 }}>{t('portal.gpsObtaining')}</span>
                    </>
                  ) : coords ? (
                    <>
                      <LocateFixed size={18} style={{ color: '#4ADE80', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', color: '#4ADE80', fontWeight: 800 }}>{t('portal.gpsCaptured')}</div>
                        {address && (
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {address}
                          </div>
                        )}
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={getGPS} style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', flexShrink: 0 }}>
                        <RefreshCw size={12} /> {t('portal.refetchGps')}
                      </button>
                    </>
                  ) : (
                    <>
                      <MapPin size={18} style={{ color: '#FF8080', flexShrink: 0 }} />
                      <span className="error-message" style={{ fontSize: '0.85rem', color: '#FF8080', flex: 1, fontWeight: 600 }}>
                        {gpsError || t('portal.locationPlaceholder')}
                      </span>
                      <button type="button" className="btn btn-primary btn-sm" onClick={getGPS} style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', flexShrink: 0 }}>
                        <LocateFixed size={12} /> {t('portal.retryGps')}
                      </button>
                    </>
                  )}
                </div>

                <div className="map-container" style={{ height: 360, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={coords ? [coords[1], coords[0]] : deviceLocation ? [deviceLocation[1], deviceLocation[0]] : MAP_CENTER} zoom={coords ? 16 : 14} style={{ height: '100%', width: '100%' }}>
                    <ChangeView center={coords ? [coords[1], coords[0]] : deviceLocation ? [deviceLocation[1], deviceLocation[0]] : MAP_CENTER} />
                    <TileLayer
                      url={OSM_TILE_URL}
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      maxZoom={19}
                    />
                    <LocationPicker onPick={applyCoords} />
                    {deviceLocation && (
                      <Marker
                        position={[deviceLocation[1], deviceLocation[0]]}
                        icon={L.divIcon({
                          html: '<div style="width:20px;height:20px;border-radius:50%;background:#00d68f;border:3px solid white;box-shadow:0 0 12px rgba(0,214,143,0.55);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;">•</div>',
                          className: '', iconSize: [20, 20], iconAnchor: [10, 10]
                        })}
                      />
                    )}
                    {coords && (
                      <Marker
                        position={[coords[1], coords[0]]}
                        icon={L.divIcon({
                          html: '<div style="width:34px;height:34px;border-radius:50%;background:#ff1744;border:3px solid white;box-shadow:0 0 16px rgba(255,23,68,0.7);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">📍</div>',
                          className: '', iconSize: [34, 34], iconAnchor: [17, 17]
                        })}
                      />
                    )}
                  </MapContainer>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← {t('common.cancel')}</button>
                  <button type="submit" className="btn btn-danger btn-lg" disabled={submitting || !coords} style={{ boxShadow: 'var(--shadow-red-glow)' }}>
                    <Send size={16} /> {submitting ? t('common.submitting') : `🚨 ${t('portal.submitIncidentBtn')}`}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
