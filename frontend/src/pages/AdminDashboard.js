import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const ROLE_COLOR = { admin: 'danger', hr: 'info', applicant: 'success' };

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({ applicants: 0, hr: 0, admins: 0, users: 0, jobs: 0, applications: 0 });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get('http://localhost:5000/admin/users', { headers }).then((r) => setUsers(r.data));
    axios.get('http://localhost:5000/admin/stats', { headers }).then((r) => setStats(r.data));
  }, [token]);

  useEffect(() => {
    let list = users;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    setFilteredUsers(list);
  }, [roleFilter, search, users]);

  const deleteUser = async (userId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.delete(`http://localhost:5000/admin/delete-user/${userId}`, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setUsers(users.filter((u) => u.id !== userId));
    } catch {
      setMessage('Error deleting user');
      setMessageType('danger');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user.id);
    setEditForm({ name: user.name, email: user.email, contact: user.contact, company: user.company || '', role: user.role });
  };

  const updateUser = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`http://localhost:5000/update-profile/${editingUser}`, editForm, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setUsers(users.map((u) => (u.id === editingUser ? { ...u, ...editForm } : u)));
      setEditingUser(null);
    } catch {
      setMessage('Error updating user');
      setMessageType('danger');
    }
  };

  const confirmDelete = () => {
    if (userToDelete) { deleteUser(userToDelete); setShowDeleteModal(false); setUserToDelete(null); }
  };

  const STAT_CARDS = [
    { label: 'Total Users',   value: stats.users,        bg: '#2563eb', icon: 'bi-people-fill' },
    { label: 'Applicants',    value: stats.applicants,   bg: '#059669', icon: 'bi-person-badge' },
    { label: 'HR Users',      value: stats.hr,           bg: '#0891b2', icon: 'bi-person-workspace' },
    { label: 'Admins',        value: stats.admins,       bg: '#d97706', icon: 'bi-shield-lock' },
    { label: 'Jobs',          value: stats.jobs,         bg: '#7c3aed', icon: 'bi-briefcase-fill' },
    { label: 'Applications',  value: stats.applications, bg: '#dc2626', icon: 'bi-file-earmark-text-fill' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage users and monitor platform activity">
      <div>

        {/* Stats */}
        <div className="row g-3 mb-5">
          {STAT_CARDS.map((s) => (
            <div className="col-6 col-md-4 col-lg-2" key={s.label}>
              <div className="stat-card text-white" style={{ background: s.bg }}>
                <i className={`bi ${s.icon}`} style={{ fontSize: '1.375rem', opacity: 0.85 }} />
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Manage Users */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h5 className="section-title mb-0">
            <i className="bi bi-people me-2" style={{ color: 'var(--primary)' }} />
            Manage Users
          </h5>
          {message && (
            <div className={`alert alert-${messageType} mb-0 py-1 px-3`} role="alert" style={{ fontSize: '0.8375rem' }}>
              {message}
            </div>
          )}
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-7">
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="col-md-5">
            <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="applicant">Applicant</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <table className="table table-bordered text-center mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{user.id}</td>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className={`badge bg-${ROLE_COLOR[user.role] || 'secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.contact}</td>
                  <td>{user.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(user)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4" style={{ color: 'var(--text-muted)' }}>
                    <i className="bi bi-inbox me-2" />No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-backdrop-custom">
          <div className="modal-card">
            <div className="modal-card-header">
              <h5><i className="bi bi-pencil-square me-2" />Update User</h5>
              <button className="btn-close-custom" onClick={() => setEditingUser(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              {[
                { label: 'Name',    key: 'name',    type: 'text'  },
                { label: 'Email',   key: 'email',   type: 'email' },
                { label: 'Contact', key: 'contact', type: 'text'  },
              ].map(({ label, key, type }) => (
                <div className="mb-3" key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type}
                    className="form-control"
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              {editForm.role !== 'applicant' && (
                <div className="mb-3">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="applicant">Applicant</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateUser}>
                <i className="bi bi-check2 me-1" />Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div className="modal-card-header">
              <h5 style={{ color: 'var(--danger)' }}>
                <i className="bi bi-exclamation-triangle me-2" />Confirm Delete
              </h5>
              <button className="btn-close-custom" onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                <i className="bi bi-trash me-1" />Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
