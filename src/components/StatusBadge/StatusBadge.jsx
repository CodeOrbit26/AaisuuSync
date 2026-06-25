import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, label }) {
  return (
    <span className={`status-badge ${status}`}>
      {label || status}
    </span>
  );
}
