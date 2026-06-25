import React from 'react';
import './StatCard.css';

export default function StatCard({ icon: Icon, iconColor = 'indigo', label, value, sub, tag, tagType }) {
  return (
    <div className="glass-card stat-card">
      {tag && <span className={`stat-card-tag ${tagType || ''}`}>{tag}</span>}
      <div className={`stat-card-icon ${iconColor}`}>
        <Icon />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && (
        <div className="stat-card-sub">
          <span className="status-dot online"></span>
          {sub}
        </div>
      )}
    </div>
  );
}
