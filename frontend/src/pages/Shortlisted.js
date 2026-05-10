import { useEffect, useState } from 'react';
import React from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

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

function Shortlisted() {
  const { job_id: jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCvDetailsFor, setShowCvDetailsFor] = useState(null);
  const [candidateToHire, setCandidateToHire] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!jobId) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`http://localhost:5000/applications/${jobId}`, { headers })
      .then((r) => {
        setApplications(r.data.filter((a) => a.shortlisted));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId, token]);

  const markAsHired = async () => {
    if (!candidateToHire) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`http://localhost:5000/hire/${candidateToHire.application_id}`, {}, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setApplications(applications.map((a) =>
        a.application_id === candidateToHire.application_id ? { ...a, status: 'hired' } : a
      ));
      setTimeout(() => { window.location.href = '/hr/jobs'; }, 1200);
    } catch {
      setMessage('Error marking as hired');
      setMessageType('danger');
    } finally {
      setCandidateToHire(null);
    }
  };

  const removeFromShortlist = async (applicationId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.delete(`http://localhost:5000/shortlist/${applicationId}`, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setApplications(applications.filter((a) => a.application_id !== applicationId));
    } catch {
      setMessage('Error removing from shortlist');
      setMessageType('danger');
    }
  };

  const viewCv = (applicationId) => {
    window.open(`http://localhost:5000/application-cv/${applicationId}`, '_blank');
  };

  const toggleDetails = (applicationId) => {
    setShowCvDetailsFor(showCvDetailsFor === applicationId ? null : applicationId);
  };

  return (
    <DashboardLayout
      title="Shortlisted Candidates"
      subtitle={!loading ? `${applications.length} shortlisted` : undefined}
    >
      <div className="mb-3">
        <button className="back-btn" onClick={() => window.history.back()}>
          <i className="bi bi-arrow-left" /> Back
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
          <p>Loading shortlisted candidates…</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-star" />
          <p>No shortlisted candidates yet. Go to the Applicant Rankings to shortlist candidates.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
          <table className="table table-bordered text-center mb-0">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th style={{ textAlign: 'left' }}>Candidate</th>
                <th style={{ minWidth: 180 }}>AI Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <React.Fragment key={application.application_id}>
                  <tr>
                    <td>
                      <span className="rank-badge">#{index + 1}</span>
                    </td>
                    <td style={{ textAlign: 'left', fontWeight: 600 }}>
                      {application.name}
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

                        {application.status === 'hired' ? (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => toggleDetails(application.application_id)}
                          >
                            {showCvDetailsFor === application.application_id
                              ? <><i className="bi bi-chevron-up me-1" />Hide</>
                              : <><i className="bi bi-chevron-down me-1" />Details</>}
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => setCandidateToHire(application)}
                            >
                              <i className="bi bi-check2-circle me-1" />Hire
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFromShortlist(application.application_id)}
                            >
                              <i className="bi bi-x-circle me-1" />Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {showCvDetailsFor === application.application_id && (
                    <tr>
                      <td colSpan={4} style={{ padding: '0.75rem 1rem', background: '#f8faff' }}>
                        <div className="cv-detail-panel">
                          <div className="cv-detail-row">
                            <strong><i className="bi bi-tools me-1" />Extracted Skills</strong>
                            <span>{application.skills_extracted || 'Not available'}</span>
                          </div>
                          <div className="cv-detail-row">
                            <strong><i className="bi bi-mortarboard me-1" />Education</strong>
                            <span>{application.education || 'Not available'}</span>
                          </div>
                          <div className="cv-detail-row">
                            <strong><i className="bi bi-briefcase me-1" />Experience</strong>
                            <span>{application.experience || 'Not available'}</span>
                          </div>
                          <div className="cv-detail-row mb-0">
                            <strong><i className="bi bi-file-text me-1" />CV Text</strong>
                            <div className="cv-text-box">
                              {application.cv_text || 'CV text not available'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {candidateToHire && (
        <div className="modal-backdrop-custom">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-card-header">
              <h5 style={{ color: 'var(--success)' }}>
                <i className="bi bi-check2-circle me-2" />Confirm Hire
              </h5>
              <button className="btn-close-custom" onClick={() => setCandidateToHire(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Hire <strong>{candidateToHire.name}</strong> for <strong>{candidateToHire.title}</strong>? This will mark the candidate as hired and close this job so no more applicants can apply.
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={() => setCandidateToHire(null)}>Cancel</button>
              <button className="btn btn-success" onClick={markAsHired}>
                <i className="bi bi-check2-circle me-1" />Hire Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Shortlisted;
