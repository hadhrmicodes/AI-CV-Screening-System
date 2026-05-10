import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const QUICK_ACTIONS = [
  {
    icon: 'bi-file-earmark-arrow-up',
    iconBg: '#eff6ff', iconColor: '#2563eb',
    title: 'My CV',
    desc: 'Upload or update the CV used for all your applications.',
    path: '/upload',
  },
  {
    icon: 'bi-briefcase',
    iconBg: '#ecfdf5', iconColor: '#059669',
    title: 'Browse Jobs',
    desc: 'Explore open positions and apply with one click.',
    path: '/jobs',
  },
  {
    icon: 'bi-file-earmark-text',
    iconBg: '#ecfeff', iconColor: '#0891b2',
    title: 'My Applications',
    desc: 'Track the status of everything you have applied for.',
    path: '/my-applications',
  },
  {
    icon: 'bi-bookmark-star',
    iconBg: '#fffbeb', iconColor: '#d97706',
    title: 'Saved Jobs',
    desc: 'Jobs you bookmarked to revisit or apply to later.',
    path: '/saved-jobs',
  },
];

function ApplicantDashboard() {
  const name   = localStorage.getItem('name');
  const userId = localStorage.getItem('user_id');

  const [stats, setStats] = useState({ applications: '—', saved: '—', shortlisted: '—' });

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:5000/my-applications/${userId}`)
      .then((r) => {
        const apps = r.data;
        setStats((prev) => ({
          ...prev,
          applications: apps.length,
          shortlisted: apps.filter((a) => a.shortlisted).length,
        }));
      })
      .catch(() => {});
    axios.get(`http://localhost:5000/saved-jobs/${userId}`)
      .then((r) => setStats((prev) => ({ ...prev, saved: r.data.length })))
      .catch(() => {});
  }, [userId]);

  const STAT_CARDS = [
    { label: 'Applications',  value: stats.applications, icon: 'bi-send-fill',        bg: '#eff6ff', color: '#2563eb' },
    { label: 'Shortlisted',   value: stats.shortlisted,  icon: 'bi-star-fill',         bg: '#fdf4ff', color: '#7c3aed' },
    { label: 'Saved Jobs',    value: stats.saved,         icon: 'bi-bookmark-star-fill',bg: '#fffbeb', color: '#d97706' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
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
            APPLICANT PORTAL
          </p>
          <h2 style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.625rem)' }}>
            Welcome back, {name || 'User'} 👋
          </h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>
            Your AI-powered job hunt starts here.
          </p>
        </div>
        <button
          className="btn"
          style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600 }}
          onClick={() => (window.location.href = '/jobs')}
        >
          <i className="bi bi-briefcase me-2" />Browse Jobs
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

export default ApplicantDashboard;
