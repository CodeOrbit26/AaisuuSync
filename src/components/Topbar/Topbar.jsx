import React from 'react';
import { useLocation } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineLink,
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './Topbar.css';

const pageMeta = {
  '/': { title: 'System Overview', subtitle: 'AaisuuSync AI Infrastructure is Online & Secure', icon: HiOutlineViewGrid },
  '/accounts': { title: 'Account Management', subtitle: 'Manage and connect your automation accounts', icon: HiOutlineUserGroup },
  '/linkedin-automation': { title: 'LinkedIn Automation', subtitle: 'Automate your LinkedIn outreach and engagement', icon: HiOutlineLink },
  '/reel-automation': { title: 'Reel Synthesis Engine', subtitle: 'Assemble stunning automated vertical videos', icon: HiOutlineFilm },
  '/yt-automation': { title: 'YouTube Automation', subtitle: 'Create, publish, and analyze videos & shorts with AI', icon: HiOutlineFilm },
  '/instagram-dm': { title: 'Instagram DM', subtitle: 'Reply to customers automatically using AI', icon: HiOutlineChatAlt2 },
  '/settings': { title: 'Settings', subtitle: 'Configure your AaisuuSync platform', icon: HiOutlineCog },
};

export default function Topbar() {
  const location = useLocation();
  const { notifications } = useApp();
  const meta = pageMeta[location.pathname] || pageMeta['/'];
  const Icon = meta.icon;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">
          <h2>
            <Icon className="topbar-title-icon" />
            {meta.title}
          </h2>
          <span className="topbar-subtitle">
            <span className="status-dot online" style={{ width: 6, height: 6 }}></span>
            {meta.subtitle}
          </span>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <HiOutlineSearch className="topbar-search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>
        <button className="topbar-btn" id="notifications-btn" aria-label="Notifications">
          <HiOutlineBell />
          {notifications.count > 0 && (
            <span className="topbar-btn-badge">{notifications.count}</span>
          )}
        </button>
      </div>
    </header>
  );
}
