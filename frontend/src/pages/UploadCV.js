import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function UploadCV() {
  const userId = localStorage.getItem('user_id');
  const token  = localStorage.getItem('token');

  const [cvFile, setCvFile]           = useState(null);
  const [hasCv, setHasCv]             = useState(false);
  const [fileName, setFileName]       = useState('');
  const [message, setMessage]         = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get(`http://localhost:5000/user-cv/${userId}`, { headers })
      .then((r) => {
        if (r.data.hasCv) {
          setHasCv(true);
          setFileName(r.data.filename || 'CV');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, token]);

  const uploadCV = async () => {
    if (!cvFile) {
      setMessage('Please select a CV file to upload');
      setMessageType('danger');
      return;
    }

    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('user_id', userId);
    setUploading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post('http://localhost:5000/upload-cv', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        setMessage(response.data.message || 'CV upload failed');
        setMessageType('danger');
        return;
      }

      setMessage(response.data.message);
      setMessageType('success');
      setCvFile(null);
      setHasCv(true);
      setFileName(response.data.filename || cvFile.name || 'CV');
    } catch {
      setMessage('Error uploading CV');
      setMessageType('danger');
    } finally {
      setUploading(false);
    }
  };

  const viewCV = () => {
    if (hasCv && userId) {
      window.open(`http://localhost:5000/user-cv-file/${userId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My CV">
        <div className="loading-state">
          <div className="spinner-ring" />
          <p>Loading CV info…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My CV" subtitle="Manage the CV used for all your job applications">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card card-elevated p-4">
          <div className="text-center mb-4">
            <div style={{
              width: 56, height: 56, background: '#eff6ff', borderRadius: 'var(--radius)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.75rem',
            }}>
              <i className="bi bi-file-earmark-person" />
            </div>
            <h5 style={{ fontWeight: 700, margin: 0 }}>Profile CV</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              This CV is used for all your job applications
            </p>
          </div>

          {message && (
            <div className={`alert alert-${messageType} mb-3`} role="alert">
              <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
              {message}
            </div>
          )}

          {!hasCv ? (
            <>
              <p className="text-center mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <i className="bi bi-info-circle me-1" />
                You haven't uploaded a CV yet. Upload one to start applying.
              </p>

              <div className="mb-3">
                <label className="form-label">Select CV File (PDF or DOCX)</label>
                <div
                  className={`upload-zone ${cvFile ? 'has-file' : ''}`}
                  style={{ position: 'relative' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className={cvFile ? 'bi bi-file-earmark-check' : 'bi bi-cloud-arrow-up'} />
                  <p>{cvFile ? cvFile.name : 'Click to browse or drag & drop'}</p>
                  {!cvFile && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      PDF or DOCX · Max 10 MB
                    </p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => { setCvFile(e.target.files[0]); setMessage(''); }}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary w-100"
                onClick={uploadCV}
                disabled={uploading || !cvFile}
                style={{ padding: '0.65rem' }}
              >
                {uploading
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Uploading…</>
                  : <><i className="bi bi-cloud-upload me-2" />Upload CV</>}
              </button>
            </>
          ) : (
            <>
              <div style={{
                background: 'var(--success-light)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem',
              }}>
                <i className="bi bi-file-earmark-check-fill" style={{ fontSize: '1.375rem', color: 'var(--success)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.9rem' }}>CV on file</div>
                  <div style={{ color: '#047857', fontSize: '0.8125rem' }}>{fileName}</div>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <button className="btn btn-outline-primary w-100" onClick={viewCV}>
                    <i className="bi bi-download me-1" /> Download CV
                  </button>
                </div>
                <div className="col-6">
                  <button
                    className="btn btn-warning w-100"
                    onClick={() => { setMessage(''); setMessageType(''); setHasCv(false); setCvFile(null); }}
                  >
                    <i className="bi bi-arrow-repeat me-1" /> Re-upload
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UploadCV;
