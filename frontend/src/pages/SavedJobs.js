import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function SavedJobs() {
  const [jobs, setJobs]       = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [actionId, setActionId] = useState(null);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:5000/saved-jobs/${userId}`).then((r) => setJobs(r.data));
  }, [userId]);

  const applyJob = async (jobId) => {
    setActionId(jobId);
    try {
      const response = await axios.post('http://localhost:5000/apply', { user_id: userId, job_id: jobId });
      setMessage(response.data.message);
      setMessageType('success');
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch {
      setMessage('Error applying to job');
      setMessageType('danger');
    } finally {
      setActionId(null);
    }
  };

  const removeSaved = async (jobId) => {
    try {
      const response = await axios.delete('http://localhost:5000/remove-saved-job', {
        data: { user_id: userId, job_id: jobId },
      });
      setMessage(response.data.message);
      setMessageType('success');
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch {
      setMessage('Error removing saved job');
      setMessageType('danger');
    }
  };

  return (
    <DashboardLayout
      title="Saved Jobs"
      subtitle={`${jobs.length} bookmarked`}
    >
      {message && (
        <div className={`alert alert-${messageType} mb-3`} role="alert">
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-bookmark" />
          <p>No saved jobs yet. Browse jobs and bookmark ones you like!</p>
        </div>
      ) : (
        <div className="row g-3">
          {jobs.map((job) => {
            const skills = job.skills ? job.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const isClosed = job.status === 'closed';
            const isActing = actionId === job.id;

            return (
              <div className="col-md-6 col-lg-4" key={job.id}>
                <div className="job-card">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <h5 className="job-title">{job.title}</h5>
                    {isClosed && (
                      <span className="badge bg-danger" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Closed</span>
                    )}
                  </div>

                  <p className="job-desc">{job.description}</p>

                  {skills.length > 0 && (
                    <div className="job-skills">
                      {skills.slice(0, 5).map((skill) => (
                        <span className="skill-badge" key={skill}>{skill}</span>
                      ))}
                      {skills.length > 5 && (
                        <span className="skill-badge" style={{ background: '#f1f5f9', color: 'var(--slate)' }}>
                          +{skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-2 d-flex flex-column gap-2">
                    <button
                      className="btn btn-primary w-100"
                      disabled={isClosed || isActing}
                      onClick={() => applyJob(job.id)}
                    >
                      {isActing
                        ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Applying…</>
                        : <><i className="bi bi-send me-1" />Apply Now</>}
                    </button>
                    <button className="btn btn-outline-danger w-100" onClick={() => removeSaved(job.id)}>
                      <i className="bi bi-bookmark-x me-1" />Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default SavedJobs;
