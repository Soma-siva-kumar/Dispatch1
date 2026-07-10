import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Shield, MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function Units() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onEvent } = useSocket();

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    unitId: '',
    officerName: '',
    officerBadge: '',
    assignedOfficer: '',
    vehicleType: 'patrol_car',
    zone: 'Zone-A',
    status: 'available'
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    load();
    loadOfficers();
    
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

  const loadOfficers = async () => {
    try {
      const { data } = await API.get('/auth');
      // Filter for users with role officer
      setOfficers(data.filter(u => u.role === 'officer'));
    } catch {
      console.warn('Could not load officer list');
    }
  };

  const handleCreateClick = () => {
    setEditingUnit(null);
    setForm({
      unitId: '',
      officerName: '',
      officerBadge: '',
      assignedOfficer: '',
      vehicleType: 'patrol_car',
      zone: 'Zone-A',
      status: 'available'
    });
    setShowModal(true);
  };

  const handleEditClick = (unit) => {
    setEditingUnit(unit);
    setForm({
      unitId: unit.unitId || '',
      officerName: unit.officerName || '',
      officerBadge: unit.officerBadge || '',
      assignedOfficer: unit.assignedOfficer?._id || unit.assignedOfficer || '',
      vehicleType: unit.vehicleType || 'patrol_car',
      zone: unit.zone || 'Zone-A',
      status: unit.status || 'available'
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this patrol unit?')) return;
    try {
      await API.delete(`/units/${unitId}`);
      toast.success('Patrol unit deleted');
      setUnits(prev => prev.filter(u => u._id !== unitId));
    } catch {
      toast.error('Failed to delete patrol unit');
    }
  };

  const handleFormChange = (field, val) => {
    setForm(f => {
      const updated = { ...f, [field]: val };
      // If changing assigned officer, auto-fill officerName and officerBadge from list
      if (field === 'assignedOfficer' && val) {
        const off = officers.find(o => o._id === val);
        if (off) {
          updated.officerName = off.name;
          updated.officerBadge = off.badgeNumber || '';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUnit) {
        const { data } = await API.patch(`/units/${editingUnit._id}`, form);
        toast.success('Patrol unit updated');
        // Reload all to populate correctly
        load();
      } else {
        const { data } = await API.post('/units', form);
        toast.success('Patrol unit created');
        load();
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save patrol unit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar title="Patrol Units" />
      <div className="main-content">
        <div className="page-container">
          {/* Header Action */}
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <button className="btn btn-primary" onClick={handleCreateClick}>
                <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Patrol Unit
              </button>
            </div>
          )}

          {/* Table */}
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
                    {isAdmin && <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>}
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
                        {unit.location?.coordinates && unit.location.coordinates[0] !== 0 ? (
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
                      {isAdmin && (
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEditClick(unit)} title="Edit Unit">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDeleteClick(unit._id)} title="Delete Unit">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Create/Edit Modal */}
          {showModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="card" style={{ maxWidth: 460, width: '90%', padding: '2rem', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute',
                    top: '1.25rem', right: '1.25rem',
                    background: 'none', border: 'none',
                    color: 'var(--text-secondary)', cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>

                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🚔 {editingUnit ? 'Edit Patrol Unit' : 'Add Patrol Unit'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label className="form-label">Unit Code / ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PCR-104"
                      value={form.unitId}
                      onChange={e => handleFormChange('unitId', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign Officer Account</label>
                    <select
                      className="form-select"
                      value={form.assignedOfficer}
                      onChange={e => handleFormChange('assignedOfficer', e.target.value)}
                    >
                      <option value="">-- No Account Assignment --</option>
                      {officers.map(o => (
                        <option key={o._id} value={o._id}>
                          👮 {o.name} ({o.badgeNumber ? `Badge: ${o.badgeNumber}` : o.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Officer Display Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.officerName}
                      onChange={e => handleFormChange('officerName', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Officer Badge Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.officerBadge}
                      onChange={e => handleFormChange('officerBadge', e.target.value)}
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Vehicle Type *</label>
                      <select
                        className="form-select"
                        value={form.vehicleType}
                        onChange={e => handleFormChange('vehicleType', e.target.value)}
                        required
                      >
                        <option value="patrol_car">Patrol Car</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="van">Van</option>
                        <option value="ambulance">Ambulance</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Zone *</label>
                      <select
                        className="form-select"
                        value={form.zone}
                        onChange={e => handleFormChange('zone', e.target.value)}
                        required
                      >
                        <option value="Zone-A">Zone-A</option>
                        <option value="Zone-B">Zone-B</option>
                        <option value="Zone-C">Zone-C</option>
                        <option value="Zone-D">Zone-D</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Status *</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={e => handleFormChange('status', e.target.value)}
                      required
                    >
                      <option value="available">Available</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="en_route">En Route</option>
                      <option value="on_scene">On Scene</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="break">Break</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowModal(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Unit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
