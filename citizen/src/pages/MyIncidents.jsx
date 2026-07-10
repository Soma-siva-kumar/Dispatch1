import { useState, useEffect } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import IncidentImageGallery from '../components/IncidentImageGallery';
import toast from 'react-hot-toast';
import { Clock, MapPin, ShieldCheck } from 'lucide-react';


export default function MyIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onEvent } = useSocket();
  const { t, lang } = useLanguage();

  useEffect(() => {
    API.get('/incidents/mine')
      .then(res => setIncidents(res.data))
      .catch(() => toast.error(t('myIncidents.failedLoad')))
      .finally(() => setLoading(false));

    const cleanup = onEvent?.('incident:update', ({ incident }) => {
      setIncidents(prev => prev.map(i => i._id === incident._id ? incident : i));
    });
    return () => cleanup?.();
  }, [onEvent, t]);

  const locale = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <>
      <Navbar title={t('myIncidents.myIncidentsTitle')} />
      <div style={{ padding: '2rem 1.5rem', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <div className="fade-in-up" style={{ maxWidth: 880, margin: '0 auto' }}>
          {/* Header section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {t('myIncidents.incDashboard')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {t('myIncidents.trackLive')}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              background: 'rgba(255,153,51,0.1)',
              border: '1px solid rgba(255,153,51,0.25)',
              borderRadius: '999px',
              fontSize: '0.75rem',
              color: 'var(--flag-saffron)',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} /> {t('common.officialCitizenPortal')}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
              <div className="spinner" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>📋</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('myIncidents.noReports')}</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                {t('myIncidents.noReportsDesc')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {incidents.map(inc => {
                const isP1 = inc.priority === 'P1';
                return (
                  <div
                    key={inc._id}
                    className="card fade-in-up"
                    style={{
                      borderLeft: `4px solid ${
                        inc.priority === 'P1'
                          ? '#ff1744'
                          : inc.priority === 'P2'
                            ? 'var(--flag-saffron)'
                            : inc.priority === 'P3'
                              ? '#ffd600'
                              : 'var(--flag-green)'
                      }`,
                      transition: 'all 0.22s ease',
                      boxShadow: isP1 ? '0 8px 30px rgba(255,23,68,0.06)' : 'var(--shadow-sm)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PriorityBadge priority={inc.priority} />
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                          {inc.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-glass)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                        <Clock size={12} style={{ color: 'var(--flag-saffron)' }} />
                        <span>{new Date(inc.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                      {inc.description}
                    </p>

                    {/* Status Dashboard details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                          {t('portal.statusLabel')}
                        </div>
                        <StatusBadge status={inc.status} />
                      </div>

                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                          {t('myIncidents.assignedUnitLabel')}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: inc.assignedUnit ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {inc.assignedUnit ? `${t('portal.activePatrol')} ${inc.assignedUnit.unitId}` : t('portal.awaitingDispatch')}
                        </div>
                      </div>

                      {inc.location?.address && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                            {t('portal.locationLabel')}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={12} style={{ color: 'var(--flag-saffron)', flexShrink: 0 }} />
                            <span>{inc.location.address}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Incident Images */}
                    {inc.images && inc.images.length > 0 && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                        <IncidentImageGallery images={inc.images} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
