import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Shield, MapPin } from 'lucide-react';

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onEvent } = useSocket();

  useEffect(() => {
    load();
    const cleanup = onEvent('unit:statusUpdate', ({ unit }) => {
      setUnits(prev => prev.map(u => u._id === unit._id ? unit : u));
    });
    const cleanup2 = onEvent('unit:position', ({ unitId, coordinates }) => {
      setUnits(prev => prev.map(u => u._id === unitId ? { ...u, location: { ...u.location, coordinates } } : u));
    });
    return () => { cleanup?.(); cleanup2?.(); };
  }, []);

  const load = async () => {
    try {
      const { data } = await API.get('/units');
      setUnits(data);
    } catch { toast.error('Failed to load units'); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Navbar title="Patrol Units" />
      <div className="main-content">
        <div className="page-container">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Unit ID', 'Officer', 'Zone', 'Status', 'Last Location', 'Performance'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {units.map(unit => (
                    <tr key={unit._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                          {unit.unitId}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div>{unit.officerName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{unit.vehicleType?.replace('_',' ')}</div>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}>{unit.zone || '—'}</td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span className={`badge badge-${unit.status}`}>{unit.status.replace('_',' ')}</span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {unit.location?.coordinates ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={12} />
                            {unit.location.coordinates[1].toFixed(4)}, {unit.location.coordinates[0].toFixed(4)}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem' }}>
                        <div>{unit.totalDispatches} Dispatches</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{unit.avgResponseTime} min avg</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
