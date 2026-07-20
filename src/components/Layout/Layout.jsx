import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import './Layout.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout-main">
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
