import { useState } from 'react';

const APPLICANT_LINKS = [
  { icon: 'bi-grid-1x2-fill',         label: 'Dashboard',       path: '/applicant' },
  { icon: 'bi-file-earmark-arrow-up', label: 'My CV',            path: '/upload' },
  { icon: 'bi-briefcase',             label: 'Browse Jobs',      path: '/jobs' },
  { icon: 'bi-bookmark-star',         label: 'Saved Jobs',       path: '/saved-jobs' },
  { icon: 'bi-file-earmark-text',     label: 'My Applications',  path: '/my-applications' },
  { icon: 'bi-person-circle',         label: 'Profile',          path: '/profile' },
];

const HR_LINKS = [
  { icon: 'bi-grid-1x2-fill', label: 'Dashboard',    path: '/hr-dashboard' },
  { icon: 'bi-plus-circle',   label: 'Post a Job',   path: '/hr' },
  { icon: 'bi-briefcase',     label: 'Manage Jobs',  path: '/hr/jobs' },
  { icon: 'bi-person-circle', label: 'Profile',      path: '/profile' },
];

const ADMIN_LINKS = [
  { icon: 'bi-shield-lock',   label: 'Admin Panel',  path: '/admin' },
  { icon: 'bi-person-circle', label: 'Profile',      path: '/profile' },
];

function Sidebar() {
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const [open, setOpen] = useState(false);

  const links = role === 'hr' ? HR_LINKS : role === 'admin' ? ADMIN_LINKS : APPLICANT_LINKS;
  const current = window.location.pathname;

  const portalLabel =
    role === 'hr' ? 'HR Portal' :
    role === 'admin' ? 'Admin Panel' :
    'Applicant Portal';

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const go = (path) => {
    window.location.href = path;
    setOpen(false);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand" onClick={() => go('/')}>
          <div className="sidebar-brand-icon">
            <i className="bi bi-cpu-fill" />
          </div>
          <div>
            <div className="sidebar-brand-name">AI CV System</div>
            <div className="sidebar-brand-role">{portalLabel}</div>
          </div>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name">{name || 'User'}</div>
            <div className="sidebar-user-role">{role || 'applicant'}</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <div
              key={link.path}
              className={`sidebar-link${current === link.path ? ' active' : ''}`}
              onClick={() => go(link.path)}
            >
              <i className={`bi ${link.icon}`} />
              <span>{link.label}</span>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
