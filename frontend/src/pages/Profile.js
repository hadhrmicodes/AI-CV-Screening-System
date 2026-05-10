import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function Profile() {
  const userId = localStorage.getItem('user_id');
  const role   = localStorage.getItem('role');

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage]   = useState('');
  const [messageType, setMessageType] = useState('');
  const [saving, setSaving]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:5000/user/${userId}`).then((r) => {
      setName(r.data.name || '');
      setEmail(r.data.email || '');
      setContact(r.data.contact || '');
      setCompany(r.data.company || '');
    });
  }, [userId]);

  const updateProfile = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`http://localhost:5000/user/${userId}`, {
        name, email, contact, company, password,
      });
      localStorage.setItem('name', name);
      setMessage(response.data.message);
      setMessageType('success');
      setPassword('');
    } catch {
      setMessage('Update failed. Please try again.');
      setMessageType('danger');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete(`http://localhost:5000/user/${userId}`);
      localStorage.clear();
      window.location.href = '/';
    } catch {
      setMessage('Delete failed');
      setMessageType('danger');
      setShowDeleteModal(false);
    }
  };

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your account details">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card card-elevated p-4">
          <div className="text-center mb-4">
            <div style={{
              width: 56, height: 56, background: '#f5f3ff', borderRadius: 'var(--radius)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: '#7c3aed', marginBottom: '0.75rem',
            }}>
              <i className="bi bi-person-circle" />
            </div>
            <h5 style={{ fontWeight: 700, margin: 0 }}>{name || 'Your Profile'}</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0' }}>
              {role === 'hr' ? 'HR / Recruiter' : role === 'admin' ? 'Administrator' : 'Applicant'}
            </p>
          </div>

          {message && (
            <div className={`alert alert-${messageType} mb-3`} role="alert">
              <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
              {message}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contact Number</label>
            <input
              className="form-control"
              placeholder="+1 555 000 0000"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          {role === 'hr' && (
            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                className="form-control"
                placeholder="Your company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="form-label">
              New Password
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.35rem' }}>
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={updateProfile}
            disabled={saving}
            style={{ padding: '0.65rem' }}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
              : <><i className="bi bi-check2 me-1" />Save Changes</>}
          </button>

          {(role === 'hr' || role === 'applicant') && (
            <>
              <div className="divider" />
              <button
                className="btn btn-outline-danger w-100"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-trash me-1" />Delete Account
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div className="modal-card-header">
              <h5 style={{ color: 'var(--danger)' }}>
                <i className="bi bi-exclamation-triangle me-2" />Delete Account
              </h5>
              <button className="btn-close-custom" onClick={() => setShowDeleteModal(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteAccount}>
                <i className="bi bi-trash me-1" />Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Profile;
