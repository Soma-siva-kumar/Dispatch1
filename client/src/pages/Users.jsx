import { useState, useEffect } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Search, Mail, Phone, Calendar, Shield, Edit2, Trash2, X } from 'lucide-react';

const ROLE_BADGES = {
  admin: 'badge-p1',
  dispatcher: 'badge-p2',
  officer: 'badge-p3',
  citizen: 'badge-p4',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Edit/Delete State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', phone: '', badgeNumber: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await API.get('/auth');
      setUsers(data);
    } catch {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'citizen',
      phone: user.phone || '',
      badgeNumber: user.badgeNumber || '',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.patch(`/auth/${editingUser._id}`, editForm);
      toast.success('User updated successfully');
      setUsers(prev => prev.map(u => u._id === data._id ? data : u));
      setEditingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete their assigned patrol unit if they are an officer.')) {
      return;
    }
    try {
      await API.delete(`/auth/${userId}`);
      toast.success('User deleted successfully');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="app-layout">
      <Navbar title="User Directory" />
      <div className="main-content">
        <div className="page-container">
          {/* Header Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 180 }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="dispatcher">Dispatchers</option>
              <option value="officer">Officers</option>
              <option value="citizen">Citizens</option>
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredUsers.length} accounts found</span>
          </div>

          {/* User Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: 'auto' }} />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['User', 'Contact Info', 'Role', 'Badge / Unit', 'Last Access', 'Registered', 'Actions'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr
                      key={u._id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* User Profile */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u._id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                            <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${ROLE_BADGES[u.role] || 'badge-pending'}`} style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>

                      {/* Badge / Unit */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {u.role === 'officer' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
                              <Shield size={12} style={{ color: 'var(--accent-cyan)' }} />
                              <span>Badge: {u.badgeNumber || '—'}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Unit: {u.assignedUnit?.unitId || 'Not Assigned'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Last Access */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {u.lastLogin ? (
                          new Date(u.lastLogin).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Never logged in</span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleEditClick(u)}
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            style={{ color: 'var(--accent-red)' }}
                            onClick={() => handleDeleteClick(u._id)}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Edit User Modal Overlay */}
          {editingUser && (
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
                  onClick={() => setEditingUser(null)}
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
                  ✏️ Edit User Details
                </h3>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Role *</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                      required
                    >
                      <option value="citizen">Citizen</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {editForm.role === 'officer' && (
                    <div className="form-group">
                      <label className="form-label">Badge Number *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.badgeNumber}
                        onChange={e => setEditForm(f => ({ ...f, badgeNumber: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditingUser(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
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
