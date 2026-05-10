import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    icon: 'bi-plus-circle',
    iconBg: '#eff6ff', iconColor: '#2563eb',
    title: 'Post a Job',
    desc: 'Create a new job listing and start receiving applications.',
    path: '/hr',
  },
  {
    icon: 'bi-briefcase',
    iconBg: '#ecfdf5', iconColor: '#059669',
    title: 'Manage Jobs',
    desc: 'View, edit, or close your active and closed job postings.',
    path: '/hr/jobs',
  },
  {
    icon: 'bi-person-circle',
    iconBg: '#f5f3ff', iconColor: '#7c3aed',
    title: 'My Profile',
    desc: 'Update your account details and company information.',
    path: '/profile',
  },
];

function HRDashboard() {
  const name  = localStorage.getItem('name');
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({ active: '—', closed: '—', total: '—' });

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get('http://localhost:5000/jobs', { headers })
      .then((r) => {
        const jobs = r.data;
        setStats({
          total:  jobs.length,
          active: jobs.filter((j) => j.status !== 'closed').length,
          closed: jobs.filter((j) => j.status === 'closed').length,
        });
      })
      .catch(() => {});
  }, [token]);

  const STAT_CARDS = [
    { label: 'Total Jobs',   value: stats.total,  icon: 'bi-briefcase-fill',   bg: '#eff6ff', color: '#2563eb' },
    { label: 'Active Jobs',  value: stats.active, icon: 'bi-circle-fill',       bg: '#ecfdf5', color: '#059669' },
    { label: 'Closed Jobs',  value: stats.closed, icon: 'bi-lock-fill',         bg: '#f1f5f9', color: '#475569' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.8125rem', opacity: 0.75, fontWeight: 500 }}>
            HR PORTAL
          </p>
          <h2 style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.625rem)' }}>
            Welcome, {name || 'HR User'} 👋
          </h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>
            Manage your job postings and find your next great hire.
          </p>
        </div>
        <button
          className="btn"
          style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600 }}
          onClick={() => (window.location.href = '/hr')}
        >
          <i className="bi bi-plus-circle me-2" />Post a Job
        </button>
      </div>

      {/* Stats row */}
      <div className="dash-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '2rem' }}>
        {STAT_CARDS.map((s) => (
          <div className="dash-stat-card" key={s.label}>
            <div className="dash-stat-icon" style={{ background: s.bg, color: s.color }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <p className="dash-section-label">Quick Actions</p>
      <div className="dash-quick-grid">
        {QUICK_ACTIONS.map((card) => (
          <div
            className="dash-quick-card"
            key={card.path}
            onClick={() => (window.location.href = card.path)}
          >
            <div className="dash-quick-icon" style={{ background: card.iconBg, color: card.iconColor }}>
              <i className={`bi ${card.icon}`} />
            </div>
            <p className="dash-quick-title">{card.title}</p>
            <p className="dash-quick-desc">{card.desc}</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginTop: 'auto' }}>
              Go <i className="bi bi-arrow-right" />
            </span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default HRDashboard;
