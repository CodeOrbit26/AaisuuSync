import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineLink,
  HiOutlineX,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/accounts', icon: HiOutlineUserGroup, label: 'Accounts' },
  { path: '/linkedin-automation', icon: HiOutlineLink, label: 'LinkedIn Automation', badge: 'NEW' },
  { path: '/reel-automation', icon: HiOutlineFilm, label: 'Reel Automation' },
  { path: '/yt-automation', icon: YTIcon, label: 'YT Automation', badge: 'NEW' },
  { path: '/instagram-dm', icon: HiOutlineChatAlt2, label: 'Instagram DM' },
  { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

function YTIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, systemStatus } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">A</div>
        <div className="sidebar-brand-text">
          <h1>AaisuuSync</h1>
          <span>AI Platform</span>
        </div>
        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <HiOutlineX />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="sidebar-link-icon">
              <item.icon />
            </span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="sidebar-link-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="sidebar-status-label">System Status</span>
          <span className="sidebar-status-value">
            <span className={`status-dot ${systemStatus.online ? 'online' : 'offline'}`}></span>
            {systemStatus.online ? 'Systems Online' : 'Offline'}
          </span>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.initials}</div>
          <div className="sidebar-user-info">
            <h4>{user.name}</h4>
            <span>{user.plan}</span>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
            <HiOutlineLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}

