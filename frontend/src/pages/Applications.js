import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

function ScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 70 ? '#059669' : pct >= 40 ? '#2563eb' : '#dc2626';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-text" style={{ color }}>{pct}%</span>
    </div>
  );
}

function Applications() {
  const { job_id: jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!jobId) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`http://localhost:5000/applications/${jobId}`, { headers })
      .then((r) => { setApplications(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId, token]);

  const shortlist = async (applicationId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/shortlist/${applicationId}`, {}, { headers });
      setApplications(applications.map((a) =>
        a.application_id === applicationId ? { ...a, shortlisted: true } : a
      ));
    } catch {
      setMessage('Error shortlisting candidate');
      setMessageType('danger');
    }
  };

  const viewCv = (applicationId) => {
    window.open(`http://localhost:5000/application-cv/${applicationId}`, '_blank');
  };

  return (
    <DashboardLayout
      title="Applicant Rankings"
      subtitle={`${applications.length} ${applications.length === 1 ? 'applicant' : 'applicants'}`}
    >
      <div className="mb-3">
        <button className="back-btn" onClick={() => window.history.back()}>
          <i className="bi bi-arrow-left" /> Back to Jobs
        </button>
      </div>

      {message && (
        <div className={`alert alert-${messageType} mb-3`} role="alert">
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner-ring" />
          <p>Scoring applicants…</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-people" />
          <p>No applications received yet for this job.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <table className="table table-bordered text-center mb-0">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Rank</th>
                <th style={{ textAlign: 'left' }}>Applicant</th>
                <th style={{ minWidth: 180 }}>AI Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <tr key={application.application_id}>
                  <td>
                    <span
                      className="rank-badge"
                      style={index < 3 ? { background: `${RANK_COLORS[index]}22`, color: RANK_COLORS[index] } : {}}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{application.name}</div>
                    {Boolean(application.shortlisted) && (
                      <span className="badge bg-primary mt-1">
                        <i className="bi bi-star-fill me-1" />Shortlisted
                      </span>
                    )}
                  </td>
                  <td>
                    <ScoreBar score={application.score} />
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => viewCv(application.application_id)}
                      >
                        <i className="bi bi-file-earmark-person me-1" />CV
                      </button>
                      {!Boolean(application.shortlisted) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => shortlist(application.application_id)}
                        >
                          <i className="bi bi-star me-1" />Shortlist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Applications;
