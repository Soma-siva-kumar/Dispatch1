import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge, IncidentCard } from '../components/IncidentComponents';
import IncidentImageGallery from '../components/IncidentImageGallery';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { MapPin, Clock, FileText, ChevronRight, Calendar, User } from 'lucide-react';
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
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function PreviousReports() {
  const { user } = useAuth();
  const [myUnit, setMyUnit] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [me, units] = await Promise.all([API.get('/auth/me'), API.get('/units')]);
      const userInfo = me.data;
      const unit = units.data.find(u => u.assignedOfficer?._id === userInfo._id || u.assignedOfficer === userInfo._id);
      
      if (unit) {
        setMyUnit(unit);
        // Load resolved/cancelled/completed incidents
        const { data } = await API.get('/incidents', { params: { limit: 1000 } });
        const unitReports = data.filter(i => i.assignedUnit?._id === unit._id || i.assignedUnit === unit._id);
        
        // Sort reports by creation date descending
        unitReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(unitReports);
        
        if (unitReports.length > 0) {
          setSelectedReport(unitReports[0]);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load previous reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading previous reports...</p>
      </div>
    );
  }

  const mapCenter = selectedReport?.location?.coordinates
    ? [selectedReport.location.coordinates[1], selectedReport.location.coordinates[0]]
    : MAP_CENTER;

  return (
    <div className="app-layout">
      <Navbar title="Previous Reports" />
      <div className="main-content">
        <div className="page-container">
          <style>{`
            .reports-grid {
              display: grid;
              gap: 1.5rem;
              align-items: start;
            }
            @media (min-width: 992px) {
              .reports-grid {
                grid-template-columns: 1fr 1.2fr;
              }
            }
            @media (max-width: 991px) {
              .reports-grid {
                grid-template-columns: 1fr;
              }
            }
            .report-card-item {
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid var(--border);
            }
            .report-card-item:hover {
              border-color: rgba(255, 153, 51, 0.35);
              background: var(--bg-glass-hover);
            }
            .report-card-item.selected {
              border-color: #FF9933;
              background: rgba(255, 153, 51, 0.08);
              box-shadow: 0 4px 15px rgba(255, 153, 51, 0.15);
            }
            .report-detail-pane {
              position: sticky;
              top: 80px;
              height: calc(100vh - 120px);
              display: flex;
              flex-direction: column;
              gap: 1rem;
              overflow-y: auto;
            }
            .timeline-scroll {
              max-height: 160px;
              overflow-y: auto;
              padding-right: 0.5rem;
            }
          `}</style>

          <div className="reports-grid">
            {/* Left side: List of reports */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <div className="card-title" style={{ color: '#F8FAFC', textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
                    <FileText size={18} /> Assignment History ({reports.length})
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No previous reports found for your unit.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {reports.map(report => (
                      <div
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className={`card report-card-item ${selectedReport?._id === report._id ? 'selected' : ''}`}
                        style={{ padding: '1rem', borderRadius: '12px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{report.title}</span>
                          <PriorityBadge priority={report.priority} />
                        </div>
                        <p className="truncate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                          {report.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgba(255,255,255,0.65)' }}>
                            <Calendar size={12} /> {new Date(report.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <StatusBadge status={report.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Report Detail view */}
            <div className="report-detail-pane">
              {selectedReport ? (
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '0' }}>
                  <div className="card-header" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
                        {selectedReport.title}
                      </h2>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                        <PriorityBadge priority={selectedReport.priority} />
                        <StatusBadge status={selectedReport.status} />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginLeft: '0.5rem' }}>
                          Reported on {new Date(selectedReport.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                    {/* Description */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Description
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>
                        {selectedReport.description}
                      </p>

                      {/* AI Voice Details */}
                      {selectedReport.isVoiceReport && (
                        <div style={{
                          marginTop: '0.75rem',
                          marginBottom: '0.75rem',
                          background: 'rgba(6, 182, 212, 0.04)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          borderRadius: '10px',
                          padding: '1rem'
                        }}>
                          <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                            🎙️ AI Voice Transcript
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#ffffff', whiteSpace: 'pre-wrap', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.45, background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            "{selectedReport.voiceTranscript}"
                          </p>

                          {/* Q&A Timeline */}
                          {selectedReport.voiceQATranscript && selectedReport.voiceQATranscript.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                                Question & Answer Timeline
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {selectedReport.voiceQATranscript.map((qa, index) => (
                                  <div key={index} style={{ borderLeft: '2px solid rgba(6,182,212,0.3)', paddingLeft: '0.6rem', fontSize: '0.78rem' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Q: {qa.question}</div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '0.1rem' }}>A: {qa.answer}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Analysis Summary */}
                          {selectedReport.aiAnalysis && (
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(6,182,212,0.15)' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                                AI NLP Analysis Extract
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                                <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Incident Type:</span> <strong>{selectedReport.aiAnalysis.incidentType?.toUpperCase()}</strong></div>
                                <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Severity:</span> <strong style={{ color: selectedReport.aiAnalysis.priority === 'P1' ? '#ff3b30' : '#ff9500' }}>{selectedReport.aiAnalysis.severity}</strong></div>
                                <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Category:</span> <strong>{selectedReport.aiAnalysis.possibleEmergencyCategory}</strong></div>
                                <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Confidence:</span> <strong style={{ color: '#34c759' }}>{(selectedReport.aiAnalysis.confidenceScore * 100).toFixed(0)}%</strong></div>
                              </div>
                              {selectedReport.aiAnalysis.keywords && selectedReport.aiAnalysis.keywords.length > 0 && (
                                <div style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Keywords:</span> {selectedReport.aiAnalysis.keywords.map(kw => <span key={kw} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.05rem 0.25rem', margin: '0 0.15rem', display: 'inline-block' }}>{kw}</span>)}
                                </div>
                              )}
                              {selectedReport.aiAnalysis.suggestedResponse && (
                                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600 }}>
                                  💡 Recommendation: {selectedReport.aiAnalysis.suggestedResponse}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                          Stats
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                          <div>Weapon Involved: <strong>{selectedReport.weaponInvolved ? 'Yes' : 'No'}</strong></div>
                          <div>Affected People: <strong>{selectedReport.peopleAffected}</strong></div>
                        </div>
                      </div>

                      {selectedReport.reportedBy && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                            Reporter Info
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                            <div>Name: <strong>{selectedReport.reportedBy.name}</strong></div>
                            {selectedReport.reportedBy.phone && <div>Phone: <strong>{selectedReport.reportedBy.phone}</strong></div>}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedReport.location?.address && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                          Location Address
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>
                          <MapPin size={14} style={{ color: '#FF9933' }} /> {selectedReport.location.address}
                        </div>
                      </div>
                    )}

                    {/* Incident Images */}
                    {selectedReport.images && selectedReport.images.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <IncidentImageGallery images={selectedReport.images} />
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedReport.timeline?.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                          Incident Timeline
                        </div>
                        <div className="timeline timeline-scroll">
                          {selectedReport.timeline.slice().reverse().map((t, i) => (
                            <div key={i} className="timeline-item" style={{ paddingBottom: '0.75rem' }}>
                              <div className="timeline-dot" style={{ width: '8px', height: '8px', top: '4px' }} />
                              <div className="timeline-content" style={{ marginLeft: '1.2rem' }}>
                                <div className="timeline-title" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>{t.note || t.status}</div>
                                <div className="timeline-time" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                                  {new Date(t.timestamp).toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Leaflet Map for selected incident */}
                    <div style={{ flex: 1, minHeight: '160px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <ChangeView center={mapCenter} />
                        <TileLayer
                          url={OSM_TILE_URL}
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          maxZoom={19}
                        />
                        {selectedReport.location?.coordinates && (
                          <Marker
                            position={[selectedReport.location.coordinates[1], selectedReport.location.coordinates[0]]}
                            icon={L.divIcon({
                              html: `<div style="width:30px;height:30px;border-radius:50%;background:#ff1744;border:2.5px solid white;box-shadow:0 0 10px rgba(255,23,68,0.6);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">🚨</div>`,
                              className: '', iconSize: [30, 30], iconAnchor: [15, 15]
                            })}
                          >
                            <Popup>
                              <div style={{ color: '#000' }}>
                                <strong>{selectedReport.title}</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '11px' }}>{selectedReport.location.address}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed var(--border)' }}>
                  <div>
                    <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Select a report from the list to view its complete audit detail and mapping.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
