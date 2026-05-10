import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function HRJobs() {
  const [jobs, setJobs]             = useState([]);
  const [message, setMessage]       = useState('');
  const [messageType, setMessageType] = useState('');
  const [section, setSection]       = useState('active');
  const [search, setSearch]         = useState('');
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [editForm, setEditForm]     = useState({ title: '', description: '', skills: '' });
  const [saving, setSaving]         = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get('http://localhost:5000/jobs', { headers }).then((r) => setJobs(r.data));
  }, [token]);

  const openEditModal = (job) => {
    setEditingJobId(job.id);
    setEditForm({ title: job.title, description: job.description, skills: job.skills });
  };

  const closeEditModal = () => {
    setEditingJobId(null);
    setEditForm({ title: '', description: '', skills: '' });
  };

  const updateJob = async () => {
    setSaving(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`http://localhost:5000/update-job/${editingJobId}`, editForm, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setJobs(jobs.map((j) => (j.id === editingJobId ? { ...j, ...editForm } : j)));
      closeEditModal();
    } catch {
      setMessage('Error updating job');
      setMessageType('danger');
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.delete(`http://localhost:5000/delete-job/${jobToDelete.id}`, { headers });
      setMessage(response.data.message);
      setMessageType('success');
      setJobs(jobs.filter((j) => j.id !== jobToDelete.id));
    } catch {
      setMessage('Error deleting job');
      setMessageType('danger');
    } finally {
      setJobToDelete(null);
    }
  };

  const viewHiredCv = (jobId) => {
    window.open(`http://localhost:5000/job-hired-cv/${jobId}`, '_blank');
  };

  const filteredJobs = jobs.filter((job) => {
    const s = search.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(s) ||
      job.description.toLowerCase().includes(s) ||
      job.skills.toLowerCase().includes(s);
    if (!matchesSearch) return false;
    return section === 'active' ? job.status !== 'closed' : job.status === 'closed';
  });

  return (
    <DashboardLayout title="Job Management" subtitle="Create, edit, and manage your job listings">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <div className="filter-tabs">
          <button className={`filter-tab ${section === 'active' ? 'active' : ''}`} onClick={() => setSection('active')}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem', verticalAlign: 'middle' }} />
            Active
          </button>
          <button className={`filter-tab ${section === 'closed' ? 'active' : ''}`} onClick={() => setSection('closed')}>
            <i className="bi bi-lock me-1" />
            Closed
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexGrow: 1, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: 320 }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search jobs…"
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => (window.location.href = '/hr')}>
            <i className="bi bi-plus-circle me-1" />Post Job
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${messageType} mb-3`} role="alert">
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {message}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-briefcase" />
          <p>{search ? 'No jobs match your search.' : `No ${section} jobs.`}</p>
        </div>
      ) : (
        <div className="job-list">
          {filteredJobs.map((job) => {
            const skills = job.skills ? job.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
            const isClosed = job.status === 'closed';

            return (
              <div className="job-list-item manage-job-list-item" key={job.id}>
                <div className="job-list-main">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <h5 className="job-title">{job.title}</h5>
                    <span className={`badge ${isClosed ? 'bg-secondary' : 'bg-success'}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {isClosed ? 'Closed' : 'Active'}
                    </span>
                  </div>

                  <p className="job-desc">{job.description}</p>

                  {skills.length > 0 && (
                    <div className="job-skills">
                      {skills.slice(0, 6).map((skill) => (
                        <span className="skill-badge skill-badge-sm" key={skill}>{skill}</span>
                      ))}
                      {skills.length > 6 && (
                        <span className="skill-badge skill-badge-sm" style={{ background: '#f1f5f9', color: 'var(--slate)' }}>
                          +{skills.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isClosed ? (
                  <div className="manage-job-actions manage-job-actions-closed">
                    <button className="btn btn-dark manage-job-primary-action" onClick={() => viewHiredCv(job.id)}>
                      <i className="bi bi-file-earmark-person me-1" />View Hired CV
                    </button>
                  </div>
                ) : (
                  <div className="manage-job-actions">
                    <button
                      className="btn btn-primary manage-job-primary-action"
                      onClick={() => (window.location.href = `/hr/applications/${job.id}`)}
                    >
                      <i className="bi bi-people me-1" />Applicants
                    </button>
                    <button
                      className="btn btn-outline-dark manage-job-primary-action"
                      onClick={() => (window.location.href = `/hr/shortlisted/${job.id}`)}
                    >
                      <i className="bi bi-star me-1" />Shortlisted
                    </button>
                    <div className="manage-job-secondary-actions">
                      <button
                        className="manage-job-icon-btn"
                        onClick={() => openEditModal(job)}
                        title="Edit job"
                        aria-label={`Edit ${job.title}`}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="manage-job-icon-btn danger"
                        onClick={() => setJobToDelete(job)}
                        title="Delete job"
                        aria-label={`Delete ${job.title}`}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {jobToDelete && (
        <div className="modal-backdrop-custom">
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div className="modal-card-header">
              <h5 style={{ color: 'var(--danger)' }}>
                <i className="bi bi-exclamation-triangle me-2" />Delete Job
              </h5>
              <button className="btn-close-custom" onClick={() => setJobToDelete(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to delete <strong>{jobToDelete.title}</strong>? This will remove the job from the platform.
              </p>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={() => setJobToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteJob}>
                <i className="bi bi-trash me-1" />Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingJobId && (
        <div className="modal-backdrop-custom">
          <div className="modal-card">
            <div className="modal-card-header">
              <h5><i className="bi bi-pencil-square me-2" />Update Job</h5>
              <button className="btn-close-custom" onClick={closeEditModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="modal-card-body">
              <div className="mb-3">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Job Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Required Skills <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma separated)</span></label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-card-footer">
              <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button className="btn btn-primary" onClick={updateJob} disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
                  : <><i className="bi bi-check2 me-1" />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default HRJobs;
