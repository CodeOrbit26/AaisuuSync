import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './Topbar.css';

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, clearNotifications, markNotificationsAsRead } = useApp();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      markNotificationsAsRead();
    }
    setShowDropdown(!showDropdown);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <HiOutlineCheckCircle className="notif-dropdown-icon success" />;
      case 'warning':
        return <HiOutlineExclamationCircle className="notif-dropdown-icon warning" />;
      case 'info':
      default:
        return <HiOutlineInformationCircle className="notif-dropdown-icon info" />;
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile hamburger button */}
        <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <HiOutlineMenu />
        </button>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <HiOutlineSearch className="topbar-search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>

        {/* Notifications Button & Dropdown Wrapper */}
        <div className="notifications-wrapper" ref={dropdownRef}>
          <button
            className={`topbar-btn ${showDropdown ? 'active' : ''}`}
            id="notifications-btn"
            aria-label="Notifications"
            onClick={handleToggleDropdown}
          >
            <HiOutlineBell />
            {notifications.count > 0 && (
              <span className="topbar-btn-badge">{notifications.count}</span>
            )}
          </button>

          {/* Premium Glassmorphic Dropdown Popover */}
          {showDropdown && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <h3>Notifications</h3>
                {notifications.items.length > 0 && (
                  <button 
                    className="notif-clear-btn"
                    onClick={clearNotifications}
                  >
                    <HiOutlineTrash /> Clear All
                  </button>
                )}
              </div>

              <div className="notif-dropdown-list">
                {notifications.items.length === 0 ? (
                  <div className="notif-dropdown-empty">
                    <HiOutlineBell className="empty-bell" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`notif-dropdown-item ${item.type}`}
                      onClick={() => {
                        setShowDropdown(false);
                        // Navigate based on type
                        if (item.type === 'warning') navigate('/accounts');
                        else if (item.type === 'success') navigate('/reel-automation');
                        else navigate('/notifications');
                      }}
                    >
                      {getIcon(item.type)}
                      <div className="notif-item-content">
                        <p>{item.message}</p>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.items.length > 0 && (
                <div className="notif-dropdown-footer">
                  <button 
                    className="notif-view-all"
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/notifications');
                    }}
                  >
                    <span>View all notifications</span>
                    <HiOutlineArrowRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
