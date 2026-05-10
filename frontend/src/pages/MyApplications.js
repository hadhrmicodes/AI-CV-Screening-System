import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function statusInfo(application) {
  if (application.application_status === 'hired') {
    return { label: 'Hired', cls: 'bg-success', icon: 'bi-trophy' };
  }
  if (Boolean(application.shortlisted)) {
    return { label: 'Shortlisted', cls: 'bg-primary', icon: 'bi-star' };
  }
  if (application.job_status === 'closed') {
    return { label: 'Closed', cls: 'bg-secondary', icon: 'bi-lock' };
  }
  return { label: 'Applied', cls: 'bg-info', icon: 'bi-send' };
}

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:5000/my-applications/${userId}`)
      .then((r) => { setApplications(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const deleteApplication = async (applicationId) => {
    try {
      await axios.delete(`http://localhost:5000/delete-application/${applicationId}`);
      setMessage('Application removed');
      setMessageType('success');
      setApplications(applications.filter((a) => a.id !== applicationId));
    } catch {
      setMessage('Error removing application');
      setMessageType('danger');
    }
  };

  return (
    <DashboardLayout
      title="My Applications"
      subtitle={`${applications.length} ${applications.length === 1 ? 'application' : 'applications'}`}
    >
      {message && (
        <div className={`alert alert-${messageType} mb-3`} role="alert">
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner-ring" />
          <p>Loading applications…</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-file-earmark-text" />
          <p>You haven't applied to any jobs yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <table className="table table-bordered text-center mb-0">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const status = statusInfo(application);
                return (
                  <tr key={application.id}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{application.title}</td>
                    <td>
                      <span className={`badge ${status.cls}`}>
                        <i className={`bi ${status.icon} me-1`} />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(application.applied_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      {application.application_status !== 'hired' && !Boolean(application.shortlisted) ? (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteApplication(application.id)}
                        >
                          <i className="bi bi-trash me-1" />Drop
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyApplications;
