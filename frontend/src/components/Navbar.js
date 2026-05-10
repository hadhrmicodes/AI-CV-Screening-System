function Navbar() {
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const go = (path) => { window.location.href = path; };

  return (
    <nav className="app-navbar">
      <div className="brand" onClick={() => go('/')}>
        <div className="brand-icon">
          <i className="bi bi-cpu-fill" />
        </div>
        <span>AI CV Screening</span>
      </div>

      <div className="nav-links">
        {role === 'applicant' && (
          <>
            <button className="nav-btn" onClick={() => go('/applicant')}>
              <i className="bi bi-grid-1x2" /> Dashboard
            </button>
            <button className="nav-btn" onClick={() => go('/jobs')}>
              <i className="bi bi-briefcase" /> Jobs
            </button>
            <button className="nav-btn" onClick={() => go('/saved-jobs')}>
              <i className="bi bi-bookmark" /> Saved
            </button>
            <button className="nav-btn" onClick={() => go('/my-applications')}>
              <i className="bi bi-file-earmark-text" /> Applications
            </button>
            <button className="nav-btn" onClick={() => go('/profile')}>
              <i className="bi bi-person-circle" /> Profile
            </button>
          </>
        )}

        {role === 'hr' && (
          <>
            <button className="nav-btn" onClick={() => go('/hr-dashboard')}>
              <i className="bi bi-grid-1x2" /> Dashboard
            </button>
            <button className="nav-btn" onClick={() => go('/hr/jobs')}>
              <i className="bi bi-briefcase" /> Jobs
            </button>
            <button className="nav-btn" onClick={() => go('/profile')}>
              <i className="bi bi-person-circle" /> Profile
            </button>
          </>
        )}

        {role === 'admin' && (
          <button className="nav-btn" onClick={() => go('/admin')}>
            <i className="bi bi-shield-lock" /> Admin
          </button>
        )}

        <button className="nav-btn nav-btn-logout" onClick={logout}>
          <i className="bi bi-box-arrow-right" /> Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
