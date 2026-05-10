import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function JobCard({ job, onApply, onSave, actionId }) {
  const skills = job.skills ? job.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const isClosed = job.status === 'closed';
  const isActing = actionId === job.id;

  return (
    <div className="job-list-item">
      <div className="job-list-main">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h5 className="job-title">{job.title}</h5>
          {isClosed && (
            <span className="badge bg-danger" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Closed</span>
          )}
        </div>

        <p className="job-desc">{job.description}</p>

        {skills.length > 0 && (
          <div className="job-skills">
            {skills.slice(0, 6).map((skill) => (
              <span className="skill-badge" key={skill}>{skill}</span>
            ))}
            {skills.length > 6 && (
              <span className="skill-badge" style={{ background: '#f1f5f9', color: 'var(--slate)' }}>
                +{skills.length - 6}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="job-list-actions">
        <button
          className="btn btn-primary"
          disabled={isClosed || isActing}
          onClick={() => onApply(job.id)}
        >
          {isActing
            ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Applying…</>
            : <><i className="bi bi-send me-1" />Apply Now</>}
        </button>
        <button className="btn btn-outline-secondary" onClick={() => onSave(job.id)}>
          <i className="bi bi-bookmark me-1" />Save Job
        </button>
      </div>
    </div>
  );
}

function Jobs() {
  const [jobs, setJobs]       = useState([]);
  const [search, setSearch]   = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [actionId, setActionId] = useState(null);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    axios.get(`http://localhost:5000/jobs?user_id=${userId}`)
      .then((r) => setJobs(r.data))
      .catch(() => { setMessage('Could not load jobs right now'); setMessageType('danger'); });
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

  const saveJob = async (jobId) => {
    try {
      const response = await axios.post('http://localhost:5000/save-job', { user_id: userId, job_id: jobId });
      setMessage(response.data.message);
      setMessageType('success');
    } catch {
      setMessage('Error saving job');
      setMessageType('danger');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const s = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(s) ||
      job.description.toLowerCase().includes(s) ||
      job.skills.toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout
      title="Browse Jobs"
      subtitle={`${filteredJobs.length} ${filteredJobs.length === 1 ? 'job' : 'jobs'} available`}
    >
      {message && (
        <div className={`alert alert-${messageType} mb-3`} role="alert">
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {message}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <i className="bi bi-search" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search jobs by title, description, or skills…"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-briefcase" />
          <p>{search ? 'No jobs match your search.' : 'No open jobs available right now.'}</p>
        </div>
      ) : (
        <div className="job-list">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={applyJob}
              onSave={saveJob}
              actionId={actionId}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Jobs;
