import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import { StatCard } from '../components/IncidentComponents';
import API from '../api/axios';

const COLORS = { P1: '#ff1744', P2: '#ff6d00', P3: '#ffd600', P4: '#00e676' };
const TYPE_COLORS = ['#4361ee','#7b5ea7','#00c8ff','#ff3b5c','#ff8c00','#00d68f','#ffd60a','#a855f7','#06b6d4','#f43f5e','#10b981','#8b5cf6'];

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(13,20,33,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      {label && <div style={{ color: '#8892a4', marginBottom: 4 }}>{label}</div>}
      {payload.map(p => <div key={p.name} style={{ color: p.color || '#e8edf5', fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [byType, setByType] = useState([]);
  const [byPriority, setByPriority] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/analytics/summary'),
      API.get('/analytics/incidents-by-type'),
      API.get('/analytics/incidents-by-priority'),
      API.get('/analytics/incidents-over-time'),
      API.get('/analytics/response-times'),
    ]).then(([s, t, p, ot, rt]) => {
      setSummary(s.data);
      setByType(t.data.map(d => ({ name: d._id, value: d.count })));
      setByPriority(p.data.map(d => ({ name: d._id, count: d.count })));
      setOverTime(ot.data.map(d => ({ date: d._id?.slice(5), count: d.count })));
      setResponseTimes(rt.data.slice(0, 30));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading analytics...</p></div>;

  return (
    <div className="app-layout">
      <Navbar title="Analytics & Intelligence" />
      <div className="main-content">
        <div className="page-container">
          <h2 style={{ marginBottom: '1.5rem' }}>📊 Incident Analytics Dashboard</h2>

          {/* Summary Stats */}
          <div className="stats-grid">
            <StatCard label="Total Incidents" value={summary?.total} icon="🚨" color="red" />
            <StatCard label="Pending" value={summary?.pending} icon="⏳" color="yellow" />
            <StatCard label="Active Dispatches" value={summary?.dispatched} icon="🚔" color="blue" />
            <StatCard label="Resolved" value={summary?.resolved} icon="✅" color="green" />
            <StatCard label="Units On-Duty" value={summary?.activeUnits} icon="👮" color="cyan" />
            <StatCard label="Avg Response" value={`${summary?.avgResponseTime || '—'} min`} icon="⏱️" color="orange" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            {/* Incidents Over Time */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📈 Incidents Over Time (30 days)</div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={overTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Area type="monotone" dataKey="count" stroke="#4361ee" fill="url(#colorCount)" strokeWidth={2} name="Incidents" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Response Times */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">⏱️ Response Times (minutes)</div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={responseTimes.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="responseMinutes" name="Minutes" radius={[4,4,0,0]}>
                    {responseTimes.slice(0, 15).map((r, i) => (
                      <Cell key={i} fill={COLORS[r.priority] || '#4361ee'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            {/* By Type */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🗂️ Incidents by Type</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#8892a4', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} width={100} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="value" name="Count" radius={[0,4,4,0]}>
                    {byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Priority */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🎯 Priority Distribution</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie data={byPriority} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {byPriority.map((entry, i) => (
                        <Cell key={i} fill={COLORS[entry.name] || '#4361ee'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {byPriority.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[p.name] }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS[p.name] }}>{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔍 Response Time Intelligence</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Priority', 'Type', 'Response Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responseTimes.slice(0, 10).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.date}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span className={`badge badge-${r.priority?.toLowerCase()}`}>{r.priority}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{r.type?.replace('_', ' ')}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', color: parseFloat(r.responseMinutes) < 5 ? 'var(--accent-green)' : parseFloat(r.responseMinutes) < 10 ? 'var(--p3)' : 'var(--p1)' }}>
                      {r.responseMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
