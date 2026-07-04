import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './index.css';

// Intercept fetch calls to rewrite /api/ endpoints to dynamic backend base URL if configured
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const base = localStorage.getItem('aaisu_backend_url') || import.meta.env.VITE_API_URL || 'https://aaisuusync.onrender.com';
    input = `${base.replace(/\/$/, '')}${input}`;
  }
  return originalFetch(input, init);
};

// Global helper to resolve media/static assets from dynamic backend base URL if configured
window.resolveUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && (url.startsWith('/uploads/') || url.startsWith('/api/'))) {
    const base = localStorage.getItem('aaisu_backend_url') || import.meta.env.VITE_API_URL || 'https://aaisuusync.onrender.com';
    return `${base.replace(/\/$/, '')}${url}`;
  }
  return url;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
