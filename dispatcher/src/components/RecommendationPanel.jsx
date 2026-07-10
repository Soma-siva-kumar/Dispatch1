import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Shield, Flame, Building2, Truck, MapPin, Phone, 
  Send, Compass, CheckCircle, RefreshCw, AlertTriangle 
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   RecommendationPanel — Dispatcher portal
   Props:
     incident   – The active selected incident object
     onDispatch – Callback when dispatch succeeds to refresh data
     onResourceClick – Callback to set map preview for resource (lat, lng, name)
   ───────────────────────────────────────────────────────────── */
export default function RecommendationPanel({ incident, onDispatch, onResourceClick }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState({}); // placeId -> boolean (loading)

  const fetchRecommendations = async () => {
    if (!incident?._id) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/incidents/${incident._id}/recommendations`);
      setRecommendations(data);
    } catch (e) {
      toast.error('Failed to load resource recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [incident?._id]);

  const handleDispatch = async (agencyType, resource) => {
    const id = resource.placeId || resource._id;
    setDispatching(prev => ({ ...prev, [id]: true }));
    try {
      const { data } = await API.post(`/incidents/${incident._id}/dispatch-agency`, {
        agencyType,
        resource
      });
      toast.success(`Successfully dispatched ${resource.name}!`);
      if (onDispatch) onDispatch(data);
      // Re-fetch recommendations to refresh local status if needed
      fetchRecommendations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dispatch failed.');
    } finally {
      setDispatching(prev => ({ ...prev, [id]: false }));
    }
  };

  if (!incident) return null;

  // Render Agency Headers / Accent Colors
  const agencyMeta = {
    police: { label: 'Nearby Police Units', color: 'var(--accent-blue)', icon: Shield },
    fire: { label: 'Nearby Fire Stations', color: 'var(--accent-red)', icon: Flame },
    hospital: { label: 'Nearby Hospitals', color: 'var(--accent-green)', icon: Building2 },
    ambulance: { label: 'Nearby Ambulances', color: 'var(--accent-orange)', icon: Truck }
  };

  const hasAnyRecs = recommendations && Object.values(recommendations).some(arr => arr && arr.length > 0);

  return (
    <>
      <style>{`
        .rec-container {
          margin-top: 1.25rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .rec-title-row {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
        }
        .rec-grid {
          display: grid; grid-template-columns: 1fr; gap: 1.25rem;
        }
        @media (min-width: 768px) {
          .rec-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        }
        .agency-section {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px; padding: 1rem;
        }
        .agency-header {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.78rem; font-weight: 800; letter-spacing: 0.05em;
          text-transform: uppercase; margin-bottom: 0.85rem; padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .rec-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px; padding: 0.75rem; margin-bottom: 0.65rem;
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .rec-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.18);
        }
        .rec-card.dispatched {
          border-left: 3px solid var(--accent-green);
        }
        .rec-card-title {
          font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
          margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: flex-start;
        }
        .rec-meta-row {
          display: flex; gap: 0.75rem; font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 0.4rem;
        }
        .rec-meta-item {
          display: flex; align-items: center; gap: 0.2rem;
        }
        .rec-address {
          font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.6rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rec-card-actions {
          display: flex; gap: 0.4rem; align-items: center; justify-content: space-between;
        }
      `}</style>

      <div className="rec-container">
        <div className="rec-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recommended Emergency Resources
            </h4>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchRecommendations} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
        ) : !hasAnyRecs ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            No recommendations found for this incident type.
          </div>
        ) : (
          <div className="rec-grid">
            {Object.entries(recommendations).map(([agency, list]) => {
              if (!list || list.length === 0) return null;
              const meta = agencyMeta[agency] || { label: agency, color: '#fff', icon: Shield };
              const Icon = meta.icon;

              return (
                <div key={agency} className="agency-section">
                  <div className="agency-header" style={{ color: meta.color }}>
                    <Icon size={14} />
                    <span>{meta.label}</span>
                  </div>

                  {list.slice(0, 3).map((item) => {
                    const id = item.placeId || item._id;
                    const isDispatched = 
                      (agency === 'police' && incident.assignedUnit?._id === item._id) ||
                      (agency === 'fire' && incident.assignedFireStation?.name === item.name) ||
                      (agency === 'hospital' && incident.assignedHospital?.name === item.name) ||
                      (agency === 'ambulance' && incident.assignedAmbulance?.name === item.name);

                    return (
                      <div key={id} className={`rec-card ${isDispatched ? 'dispatched' : ''}`}>
                        <div className="rec-card-title">
                          <span style={{ cursor: 'pointer' }} onClick={() => onResourceClick && onResourceClick(item.lat || item.location?.coordinates?.[1], item.lng || item.location?.coordinates?.[0], item.name, agency)}>
                            {item.name || item.unitId}
                          </span>
                          {isDispatched && <span style={{ fontSize: '0.65rem', color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}><CheckCircle size={10} /> Dispatched</span>}
                        </div>

                        <div className="rec-meta-row">
                          <span className="rec-meta-item">
                            <Compass size={11} /> {item.distanceKm ? `${item.distanceKm} km` : '—'}
                          </span>
                          <span className="rec-meta-item">
                            <Truck size={11} /> ETA: {item.etaMins ? `${item.etaMins}m` : '—'}
                          </span>
                          {item.engines !== undefined && (
                            <span className="rec-meta-item">
                              🔥 Engines: {item.engines}
                            </span>
                          )}
                        </div>

                        <div className="rec-address" title={item.address || 'Mock Address'}>
                          <MapPin size={10} style={{ marginRight: '0.15rem', verticalAlign: 'middle' }} />
                          {item.address || 'HYD Center'}
                        </div>

                        <div className="rec-card-actions">
                          {item.contact ? (
                            <a href={`tel:${item.contact}`} className="rec-meta-item" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                              <Phone size={10} /> {item.contact}
                            </a>
                          ) : <span />}

                          {!isDispatched && (
                            <button 
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', height: 'auto', background: meta.color, borderColor: meta.color }}
                              onClick={() => handleDispatch(agency, item)}
                              disabled={dispatching[id]}
                            >
                              <Send size={10} style={{ marginRight: '0.15rem' }} /> 
                              {dispatching[id] ? 'Dispatching...' : 'Dispatch'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
