function Home() {
  const go = (path) => { window.location.href = path; };

  return (
    <div className="home-root" style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #e8f0fe 45%, #ede9fe 100%)' }}>

      {/* ── Top Nav ─────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="home-nav-brand" onClick={() => go('/')}>
          <div className="home-nav-brand-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          AI CV Screening
        </div>
        <div className="home-nav-actions">
          <button className="btn btn-outline-primary btn-sm" onClick={() => go('/login')}>
            <i className="bi bi-box-arrow-in-right me-1" />Login
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => go('/register')}>
            <i className="bi bi-person-plus me-1" />Register
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <div className="home-hero-section" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>
        <span className="home-badge">
          <i className="bi bi-stars" /> AI-Powered Recruitment Platform
        </span>

        <h1 className="home-title">
          Hire Smarter with<br />
          <span>AI CV Screening</span>
        </h1>

        <p className="home-subtitle">
          Automatically rank applicants against job requirements using TF-IDF matching
          and NLP — helping HR teams make faster, fairer hiring decisions.
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem', boxShadow: 'var(--shadow-primary)' }}
            onClick={() => go('/login')}
          >
            <i className="bi bi-box-arrow-in-right me-2" />Get Started
          </button>
          <button
            className="btn btn-outline-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '0.9375rem' }}
            onClick={() => go('/register')}
          >
            <i className="bi bi-person-plus me-2" />Create Account
          </button>
        </div>

        {/* Stats row */}
        <div className="home-stats-row">
          {[
            { value: 'AI', label: 'Powered' },
            { value: '3',  label: 'Role Types' },
            { value: 'NLP', label: 'CV Parsing' },
            { value: '1-Click', label: 'Apply' },
          ].map((s) => (
            <div className="home-stat-item" key={s.label}>
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────── */}
      <div className="home-features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: 'clamp(1.375rem, 3vw, 1.875rem)', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Everything you need to hire better
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
              One platform for applicants, HR teams, and administrators.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              {
                icon: 'bi-file-earmark-person',
                bg: '#eff6ff', color: '#2563eb',
                title: 'Smart CV Parsing',
                desc: 'Extracts skills, education and experience from PDF & DOCX files automatically using NLP.',
              },
              {
                icon: 'bi-bar-chart-line',
                bg: '#ecfdf5', color: '#059669',
                title: 'AI Ranking',
                desc: 'TF-IDF cosine similarity scores applicants against job descriptions in real time.',
              },
              {
                icon: 'bi-funnel',
                bg: '#fdf4ff', color: '#7c3aed',
                title: 'Shortlisting & Hiring',
                desc: 'HR can shortlist top candidates and mark them as hired with a single click.',
              },
              {
                icon: 'bi-people',
                bg: '#fffbeb', color: '#d97706',
                title: 'Role-Based Access',
                desc: 'Applicants, HR, and Admins each get a secure, tailored dashboard experience.',
              },
            ].map((f) => (
              <div className="col-6 col-md-3" key={f.title}>
                <div className="home-feature-item">
                  <div className="home-feature-icon" style={{ background: f.bg, color: f.color }}>
                    <i className={`bi ${f.icon}`} />
                  </div>
                  <h6>{f.title}</h6>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────── */}
      <div className="home-steps">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              How it works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
              Three simple steps to smarter hiring.
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { num: '1', title: 'Upload Your CV', desc: 'Applicants upload a PDF or DOCX — the system extracts skills, education and experience automatically.' },
              { num: '2', title: 'Apply to Jobs',  desc: 'Browse open positions and apply with one click. AI scores your CV against each job description.' },
              { num: '3', title: 'Get Shortlisted',desc: 'HR reviews ranked candidates, shortlists top matches, and hires directly from the platform.' },
            ].map((step) => (
              <div className="col-md-4" key={step.num}>
                <div className="home-step-item">
                  <div className="home-step-num">{step.num}</div>
                  <h6>{step.title}</h6>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{ color: 'white', fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.875rem)', marginBottom: '0.75rem' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.9375rem', marginBottom: '1.75rem', maxWidth: 420, margin: '0 auto 1.75rem' }}>
          Join as an applicant or HR recruiter and experience AI-powered hiring today.
        </p>
        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ background: 'white', color: 'var(--primary)', fontWeight: 600, padding: '0.75rem 2rem' }}
            onClick={() => go('/login')}
          >
            <i className="bi bi-box-arrow-in-right me-2" />Login
          </button>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)', fontWeight: 600, padding: '0.75rem 2rem' }}
            onClick={() => go('/register')}
          >
            <i className="bi bi-person-plus me-2" />Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
