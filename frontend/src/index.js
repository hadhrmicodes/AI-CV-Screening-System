/*
 * Module: Frontend Entry Point
 * Purpose: Boots the React application and loads global CSS dependencies for
 * the AI CV Screening System frontend.
 */

// ===========================
// IMPORTS
// ===========================

import React from 'react';
import ReactDOM from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';


// ===========================
// APPLICATION BOOTSTRAP
// ===========================

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);
