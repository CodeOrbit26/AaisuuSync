import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { useApp } from '../../context/AppContext';
import './Layout.css';

const pageTitles = {
  '/settings': 'Platform Settings',
  '/notifications': 'Notifications History',
  '/upgrade': 'Upgrade Plan',
  '/get-help': 'Help & Support',
  '/learn-more': 'Platform Documentation',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const fullScreenRoutes = ['/settings', '/notifications', '/upgrade', '/get-help', '/learn-more'];
  const isFullScreen = fullScreenRoutes.includes(location.pathname);

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

  if (isFullScreen) {
    const currentTitle = pageTitles[location.pathname] || 'Workspace';
    return (
      <div className="layout layout-fullscreen">
        <header className="fullscreen-header">
          <button className="fullscreen-back-btn" onClick={() => navigate('/')}>
            <HiOutlineArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <div className="fullscreen-header-title">
            <span>{currentTitle}</span>
          </div>
          <div className="fullscreen-header-badge">
            <span className="badge-dot"></span> AaisuuSync Workspace
          </div>
        </header>
        <main className="fullscreen-content">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
