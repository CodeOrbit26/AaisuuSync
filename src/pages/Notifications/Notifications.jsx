import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlinePlay
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './Notifications.css';

export default function Notifications() {
  const { notifications, clearNotifications, markNotificationsAsRead } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Automatically mark as read when visiting the page
    markNotificationsAsRead();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <HiOutlineCheckCircle className="notif-page-icon success" />;
      case 'warning':
        return <HiOutlineExclamationCircle className="notif-page-icon warning" />;
      case 'info':
      default:
        return <HiOutlineInformationCircle className="notif-page-icon info" />;
    }
  };

  return (
    <div className="notifications-page-container page-container fade-in">
      {/* Top Title Section */}
      <div className="notif-page-header">
        <div className="header-left">
          <div>
            <h2>Notifications Log</h2>
            <p>Complete execution history and pipeline reports from connected AI agents</p>
          </div>
        </div>

        <button 
          className="clear-all-page-btn"
          onClick={clearNotifications}
          disabled={notifications.items.length === 0}
        >
          <HiOutlineTrash />
          <span>Clear All History</span>
        </button>
      </div>

      {/* Main List */}
      <div className="notif-page-content">
        {notifications.items.length === 0 ? (
          <div className="notif-page-empty">
            <HiOutlineBell className="empty-bell-icon" />
            <h3>No notifications yet</h3>
            <p>Your AI pipeline events, reel synthesis reports, and system alerts will appear here.</p>
          </div>
        ) : (
          <div className="notif-page-list">
            {notifications.items.map((item) => (
              <div key={item.id} className={`notif-page-item ${item.type}`}>
                <div className="notif-page-item-left">
                  {getIcon(item.type)}
                  <div className="notif-page-details">
                    <p className="notif-page-msg">{item.message}</p>
                    <span className="notif-page-time">{item.time}</span>
                  </div>
                </div>

                <div className="notif-page-actions">
                  <span className="pipeline-status-badge">
                    <span className="pipeline-dot"></span> Pipeline Run
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
