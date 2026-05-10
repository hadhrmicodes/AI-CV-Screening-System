/*
 * Module: Frontend Routing
 * Purpose: Defines the top-level React routes for applicant, HR, and admin
 * pages in the AI CV Screening System.
 */

// ===========================
// IMPORTS
// ===========================

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import AddJob from './pages/AddJob';
import AdminDashboard from './pages/AdminDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import Applications from './pages/Applications';
import Home from './pages/Home';
import HRDashboard from './pages/HRDashboard';
import HRJobs from './pages/HRJobs';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import SavedJobs from './pages/SavedJobs';
import Shortlisted from './pages/Shortlisted';
import UploadCV from './pages/UploadCV';


// ===========================
// APPLICATION ROUTES
// ===========================

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Shared dashboard and profile routes */}
        <Route path="/applicant" element={<ProtectedRoute allowedRoles={['applicant']}><ApplicantDashboard /></ProtectedRoute>} />
        <Route path="/hr-dashboard" element={<ProtectedRoute allowedRoles={['hr']}><HRDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['applicant', 'hr', 'admin']}><Profile /></ProtectedRoute>} />

        {/* HR routes */}
        <Route path="/hr" element={<ProtectedRoute allowedRoles={['hr']}><AddJob /></ProtectedRoute>} />
        <Route path="/hr/jobs" element={<ProtectedRoute allowedRoles={['hr']}><HRJobs /></ProtectedRoute>} />
        <Route path="/hr/applications/:job_id" element={<ProtectedRoute allowedRoles={['hr']}><Applications /></ProtectedRoute>} />
        <Route path="/hr/shortlisted/:job_id" element={<ProtectedRoute allowedRoles={['hr']}><Shortlisted /></ProtectedRoute>} />

        {/* Applicant routes */}
        <Route path="/jobs" element={<ProtectedRoute allowedRoles={['applicant']}><Jobs /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute allowedRoles={['applicant']}><MyApplications /></ProtectedRoute>} />
        <Route path="/saved-jobs" element={<ProtectedRoute allowedRoles={['applicant']}><SavedJobs /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute allowedRoles={['applicant']}><UploadCV /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
