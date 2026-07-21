import React, { useState, useRef, useEffect } from 'react';
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
  HiOutlineGlobeAlt,
  HiOutlineQuestionMarkCircle,
  HiOutlineArrowCircleUp,
  HiOutlineDownload,
  HiOutlineInformationCircle,
  HiOutlineChevronRight,
  HiOutlineChevronDown
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/accounts', icon: HiOutlineUserGroup, label: 'Accounts' },
  { path: '/linkedin-automation', icon: HiOutlineLink, label: 'LinkedIn Automation' },
  { path: '/reel-automation', icon: HiOutlineFilm, label: 'Reel Automation' },
  { path: '/yt-automation', icon: YTIcon, label: 'YT Automation' },
  { path: '/instagram-dm', icon: HiOutlineChatAlt2, label: 'Instagram DM' },
];

function YTIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, systemStatus, sidebarCollapsed, toggleSidebar } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close profile popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-left">
          <div className="sidebar-brand-logo">A</div>
          {!sidebarCollapsed && (
            <div className="sidebar-brand-text">
              <h1>AaisuuSync</h1>
              <span>AI Platform</span>
            </div>
          )}
        </div>

        {/* Sidebar Toggle Button (Claude Style) */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebar} 
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Minimize sidebar (⌘B)'}
        >
          <SidebarToggleIcon />
        </button>

        {/* Mobile close button */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <HiOutlineX />
        </button>
      </div>

      <nav className="sidebar-nav">
        {!sidebarCollapsed && <div className="sidebar-section-label">Main Menu</div>}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="sidebar-link-icon">
              <item.icon />
            </span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" ref={menuRef}>
        {!sidebarCollapsed && (
          <div className="sidebar-status">
            <span className="sidebar-status-label">System Status</span>
            <span className="sidebar-status-value">
              <span className={`status-dot ${systemStatus.online ? 'online' : 'offline'}`}></span>
              {systemStatus.online ? 'Systems Online' : 'Offline'}
            </span>
          </div>
        )}

        {/* User Card Widget */}
        <div 
          className="sidebar-user" 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title={sidebarCollapsed ? `${user.name || 'Abhay Gupta'} (${user.email})` : undefined}
        >
          <div className="sidebar-user-avatar">{user.initials || 'AG'}</div>
          {!sidebarCollapsed && (
            <div className="sidebar-user-info">
              <h4>{user.name || 'Abhay Gupta'}</h4>
              <span className="sidebar-user-plan">{user.plan || 'AaisuuSync Free'}</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="sidebar-logout-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); }} aria-label="Logout" title="Logout">
              <HiOutlineLogout />
            </button>
          )}
        </div>

        {/* Profile Popover Menu (Matching IDE/ChatGPT User Profile Menu) */}
        {showProfileMenu && (
          <div className={`profile-popover ${sidebarCollapsed ? 'collapsed-popover' : ''}`}>
            <div className="profile-popover-header">
              <span className="profile-popover-email">{user.email || 'abhaygupta26nov11@gmail.com'}</span>
            </div>

            <div className="profile-popover-section">
              <button className="profile-popover-item" onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}>
                <span className="popover-item-left"><HiOutlineCog /> Settings</span>
                <span className="popover-item-shortcut">⌘,</span>
              </button>
              <button className="profile-popover-item" onClick={() => setShowProfileMenu(false)}>
                <span className="popover-item-left"><HiOutlineGlobeAlt /> Language</span>
                <HiOutlineChevronRight className="popover-item-arrow" />
              </button>
              <button className="profile-popover-item" onClick={() => setShowProfileMenu(false)}>
                <span className="popover-item-left"><HiOutlineQuestionMarkCircle /> Get help</span>
              </button>
            </div>

            <div className="profile-popover-divider"></div>

            <div className="profile-popover-section">
              <button className="profile-popover-item highlight" onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}>
                <span className="popover-item-left"><HiOutlineArrowCircleUp /> Upgrade plan</span>
              </button>
              <button className="profile-popover-item" onClick={() => setShowProfileMenu(false)}>
                <span className="popover-item-left"><HiOutlineDownload /> Get apps and extensions</span>
              </button>
              <button className="profile-popover-item" onClick={() => setShowProfileMenu(false)}>
                <span className="popover-item-left"><HiOutlineInformationCircle /> Learn more</span>
                <HiOutlineChevronRight className="popover-item-arrow" />
              </button>
            </div>

            <div className="profile-popover-divider"></div>

            <div className="profile-popover-section">
              <button className="profile-popover-item danger" onClick={handleLogout}>
                <span className="popover-item-left"><HiOutlineLogout /> Log out</span>
              </button>
            </div>

            {/* Bottom Workspace Pill inside Menu */}
            <div className="profile-popover-footer">
              <div className="workspace-pill">
                <div className="workspace-pill-icon">A</div>
                <span>AaisuuSync · Free</span>
                <HiOutlineChevronDown className="workspace-chevron" />
              </div>
              <HiOutlineDownload className="workspace-download-icon" title="Download desktop App" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
