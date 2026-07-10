import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { PriorityBadge, StatusBadge } from '../components/IncidentComponents';
import toast from 'react-hot-toast';
import { Search, Camera } from 'lucide-react';


export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { onEvent } = useSocket();

  useEffect(() => {
    load();
    const cleanup = onEvent('incident:update', ({ incident }) => {
      setIncidents(prev => prev.map(i => i._id === incident._id ? incident : i));
    });
    const cleanup2 = onEvent('incident:new', ({ incident }) => {
      setIncidents(prev => [incident, ...prev]);
    });
    return () => { cleanup?.(); cleanup2?.(); };
  }, []);

  const load = async () => {
    try {
      const { data } = await API.get('/incidents', { params: { limit: 200 } });
      setIncidents(data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const filtered = incidents.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !priorityFilter || i.priority === priorityFilter;
    const matchStatus = !statusFilter || i.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.patch(`/incidents/${id}/status`, { status });
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="app-layout">
      <Navbar title="Admin - All Incidents" />
      <div className="main-content">
        <div className="page-container">
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search incidents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
            <select className="form-select" style={{ width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              {['P1','P2','P3','P4'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['pending','dispatched','en_route','arrived','resolved','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} results</span>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }} /></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Priority', 'Incident', 'Type', 'Status', 'Location', 'Time', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inc => (
                    <tr key={inc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.65rem 1rem' }}><PriorityBadge priority={inc.priority} /></td>
                      <td style={{ padding: '0.65rem 1rem', maxWidth: 240 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                          {inc.weaponInvolved && <span style={{ fontSize: '0.65rem', color: 'var(--p1)' }}>⚠️ Weapon</span>}
                          {inc.images?.length > 0 && (
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Camera size={10} /> {inc.images.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{inc.type?.replace('_',' ')}</td>
                      <td style={{ padding: '0.65rem 1rem' }}><StatusBadge status={inc.status} /></td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.location?.address || '—'}
                      </td>
                      <td style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(inc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {inc.status === 'pending' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(inc._id, 'dispatched')}>Dispatch</button>
                          )}
                          {inc.status === 'arrived' && (
                            <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(inc._id, 'resolved')}>Resolve</button>
                          )}
                        </div>
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
