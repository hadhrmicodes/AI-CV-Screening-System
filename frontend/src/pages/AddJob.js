import { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function AddJob() {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills]         = useState('');
  const [message, setMessage]       = useState('');
  const [messageType, setMessageType] = useState('');
  const [saving, setSaving]         = useState(false);
  const token = localStorage.getItem('token');

  const handleAddJob = async () => {
    if (!title.trim() || !description.trim()) {
      setMessage('Job title and description are required');
      setMessageType('danger');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post('http://localhost:5000/add-job', { title, description, skills }, { headers });

      setMessage(response.data.message);
      setMessageType('success');
      setTitle('');
      setDescription('');
      setSkills('');
    } catch {
      setMessage('Error creating job. Please try again.');
      setMessageType('danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Post a Job" subtitle="Create a new job listing">
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div className="card card-elevated p-4">
          <div className="text-center mb-4">
            <div style={{
              width: 56, height: 56, background: '#eff6ff', borderRadius: 'var(--radius)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.75rem',
            }}>
              <i className="bi bi-briefcase-fill" />
            </div>
            <h5 style={{ fontWeight: 700, margin: 0 }}>New Job Listing</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Fill in the details below and publish your job posting
            </p>
          </div>

          {message && (
            <div className={`alert alert-${messageType} mb-3`} role="alert">
              <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
              {message}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">
              Job Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Senior React Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Job Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              className="form-control"
              placeholder="Describe the role, responsibilities, and requirements…"
              value={description}
              rows={5}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">
              Required Skills
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.35rem' }}>
                (comma separated)
              </span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. React, Node.js, TypeScript, SQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            {skills && (
              <div className="job-skills mt-2">
                {skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span className="skill-badge" key={s}>{s}</span>
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-success w-100"
            onClick={handleAddJob}
            disabled={saving}
            style={{ padding: '0.65rem' }}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Publishing…</>
              : <><i className="bi bi-send me-1" />Publish Job</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AddJob;
