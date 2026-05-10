import { useEffect, useState } from 'react';
import axios from 'axios';
import { getDashboardPath, hasActiveSession } from '../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasActiveSession()) {
      window.location.replace(getDashboardPath(localStorage.getItem('role')));
    }
  }, []);

  const handleLogin = async () => {
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      const { role, user_id: userId, name, token, message: responseMessage } = response.data;

      if (token && userId && (role === 'hr' || role === 'admin' || role === 'applicant')) {
        localStorage.setItem('user_id', userId);
        localStorage.setItem('role', role);
        localStorage.setItem('name', name || '');
        localStorage.setItem('token', token);

        window.location.replace(getDashboardPath(role));
        return;
      }

      setMessage(responseMessage || 'Invalid credentials');
      setMessageType('danger');
    } catch (error) {
      console.log(error);
      setMessage('Login error. Please try again.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div className="auth-shell">
      <button className="auth-back-btn" onClick={() => window.location.href = '/'}>
        <i className="bi bi-arrow-left" /> Back
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          <span className="auth-brand-name">AI CV Screening</span>
        </div>

        <h3>Welcome back</h3>
        <p className="auth-sub">Sign in to continue to your account</p>

        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {message && (
          <div className={`alert alert-${messageType} mb-3`} role="alert">
            <i className={`bi bi-${messageType === 'danger' ? 'exclamation-circle' : 'check-circle'} me-2`} />
            {message}
          </div>
        )}

        <button
          className="btn btn-primary w-100"
          onClick={handleLogin}
          disabled={loading}
          style={{ padding: '0.65rem' }}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2" role="status" /> Signing in…</>
          ) : (
            <><i className="bi bi-box-arrow-in-right me-1" /> Sign In</>
          )}
        </button>

        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.8375rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => (window.location.href = '/register')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
