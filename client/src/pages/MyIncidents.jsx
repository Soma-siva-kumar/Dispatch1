import { useState, useEffect } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export default function MyIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onEvent } = useSocket();

  useEffect(() => {
    API.get('/incidents/mine')
      .then(res => setIncidents(res.data))
      .catch(() => toast.error('Failed to load your reports'))
      .finally(() => setLoading(false));

    const cleanup = onEvent?.('incident:update', ({ incident }) => {
      setIncidents(prev => prev.map(i => i._id === incident._id ? incident : i));
    });
    return () => cleanup?.();
  }, []);

  return (
    <div className="app-layout">
      <Navbar title="My Emergency Reports" />
      <div className="main-content">
        <div className="page-container" style={{ maxWidth: 800, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
          ) : incidents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3>No Reports Yet</h3>
              <p>You haven't reported any emergencies.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incidents.map(inc => (
                <div key={inc._id} className="card">
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <PriorityBadge priority={inc.priority} />
                      <span style={{ fontWeight: 600 }}>{inc.title}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(inc.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{inc.description}</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--bg-glass)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                      <div style={{ marginTop: '0.25rem' }}><StatusBadge status={inc.status} /></div>
                    </div>
                    {inc.assignedUnit && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Unit</div>
                        <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>🚔 {inc.assignedUnit.unitId}</div>
                      </div>
                    )}
                    {inc.location?.address && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>📍 {inc.location.address}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
