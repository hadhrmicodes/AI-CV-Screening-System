import Sidebar from './Sidebar';

function DashboardLayout({ children, title, subtitle }) {
  const name = localStorage.getItem('name');

  return (
    <div className="dashboard-root">
      <Sidebar />
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            {title && <h4 className="topbar-title">{title}</h4>}
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <i className="bi bi-person-circle" style={{ color: 'var(--primary)', fontSize: '1rem' }} />
              <span className="topbar-greeting">{name || 'User'}</span>
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
