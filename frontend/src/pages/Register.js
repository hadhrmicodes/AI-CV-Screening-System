import { useEffect, useState } from 'react';
import axios from 'axios';
import { getDashboardPath, hasActiveSession } from '../utils/auth';

function Register() {
  const [role, setRole] = useState('applicant');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasActiveSession()) {
      window.location.replace(getDashboardPath(localStorage.getItem('role')));
    }
  }, []);

  const handleRegister = async () => {
    setMessage('');

    if (!name || !email || !password || !contact) {
      setMessage('Please fill all required fields');
      setMessageType('danger');
      return;
    }

    if (role === 'hr' && !company) {
      setMessage('Company Name is required for HR accounts');
      setMessageType('danger');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/register', {
        name, email, password, role, contact, company,
      });

      const { user_id: userId, token, message: responseMessage } = response.data;

      if (!userId || !token || responseMessage !== 'Registration successful') {
        setMessage(responseMessage || 'Registration failed');
        setMessageType('danger');
        return;
      }

      setMessage(responseMessage);
      setMessageType('success');

      localStorage.setItem('user_id', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      localStorage.setItem('token', token);

      window.location.replace(getDashboardPath(role));
    } catch (error) {
      setMessage('Registration failed. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <button className="auth-back-btn" onClick={() => window.location.href = '/'}>
        <i className="bi bi-arrow-left" /> Back
      </button>

      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          <span className="auth-brand-name">AI CV Screening</span>
        </div>

        <h3>Create account</h3>
        <p className="auth-sub">Join as an applicant or HR professional</p>

        <div className="mb-3">
          <label className="form-label">I am a…</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="applicant">Job Applicant</option>
            <option value="hr">HR / Recruiter</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            className="form-control"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contact Number <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            className="form-control"
            placeholder="+1 555 000 0000"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        {role === 'hr' && (
          <div className="mb-3">
            <label className="form-label">Company Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              className="form-control"
              placeholder="Acme Corp"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="password"
            className="form-control"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {message && (
          <div className={`alert alert-${messageType} mb-3`} role="alert">
            <i className={`bi bi-${messageType === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2`} />
            {message}
          </div>
        )}

        <button
          className="btn btn-success w-100"
          onClick={handleRegister}
          disabled={loading}
          style={{ padding: '0.65rem' }}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2" role="status" /> Creating account…</>
          ) : (
            <><i className="bi bi-person-plus me-1" /> Create Account</>
          )}
        </button>

        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.8375rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            onClick={() => (window.location.href = '/login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
