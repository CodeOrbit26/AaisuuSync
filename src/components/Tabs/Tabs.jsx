import React from 'react';
import './Tabs.css';

export default function Tabs({ tabs, activeTab, onTabChange, onChange, variant = 'default' }) {
  const handleChange = onTabChange || onChange;

  return (
    <div className={`tabs ${variant}`}>
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        // Support both JSX elements and component references
        const iconNode = IconComp
          ? (typeof IconComp === 'function' ? <IconComp /> : IconComp)
          : null;

        return (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleChange(tab.id)}
            id={`tab-${tab.id}`}
          >
            {iconNode && <span className="tab-btn-icon">{iconNode}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-btn-count">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
