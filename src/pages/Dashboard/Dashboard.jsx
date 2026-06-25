import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChip,
  HiOutlineLightningBolt,
  HiOutlineChatAlt2,
  HiOutlineFilm,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineSwitchHorizontal,
  HiOutlineCheck,
  HiOutlineTrendingUp,
  HiOutlineTerminal
} from 'react-icons/hi';
import StatCard from '../../components/StatCard/StatCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { useApp } from '../../context/AppContext';
import './Dashboard.css';

export default function Dashboard() {
  const { systemStatus, activeModel, setActiveModel, currentModel, AI_MODELS, connectedAccounts, blueprints, user } = useApp();
  const [showModelPicker, setShowModelPicker] = useState(false);

  const activeIgCount = connectedAccounts.instagram.filter(acc => acc.status === 'healthy').length;
  const totalReelDrafts = Object.values(blueprints).reduce((sum, bp) => sum + (bp.generated?.length || 0), 0);

  return (
    <div className="dashboard page-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner animate-fade-in">
        <div className="welcome-text-side">
          <h2>Welcome back, <span className="gradient-text">{user?.name || 'Abhay Gupta'}</span> ✨</h2>
          <p>Here is your global publishing status and automated reel agent activity today.</p>
        </div>
        <div className="welcome-date-side">
          <div className="date-badge">
            <span className="pulse-indicator"></span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats stagger">
        <StatCard
          icon={HiOutlineUserGroup}
          iconColor="purple"
          label="Instagram Accounts"
          value={activeIgCount.toString()}
          sub={activeIgCount > 0 ? "Pipeline Healthy" : "No Sessions linked"}
        />
        <StatCard
          icon={HiOutlineDocumentText}
          iconColor="blue"
          label="AI Reel Drafts"
          value={`${totalReelDrafts} Drafts`}
          sub="Ready to Generate"
        />

        {/* AI Processing — Interactive */}
        <div className="glass-card stat-card ai-processing-card accent-border-cyan" onClick={() => setShowModelPicker(!showModelPicker)}>
          <div className="stat-card-icon" style={{ background: `${currentModel.color}18`, color: currentModel.color }}>
            <HiOutlineChip />
          </div>
          <div className="stat-card-label">AI Processing</div>
          <div className="stat-card-value">{currentModel.name}</div>
          <div className="stat-card-sub">
            <span className="status-dot online"></span>
            {currentModel.type} API Active
            <HiOutlineSwitchHorizontal style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '0.9rem' }} />
          </div>

          {showModelPicker && (
            <div className="model-picker">
              <div className="model-picker-title">Switch AI Model</div>
              {AI_MODELS.map((model) => (
                <div
                  key={model.id}
                  className={`model-picker-item ${activeModel === model.id ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveModel(model.id); setShowModelPicker(false); }}
                >
                  <span className="model-picker-dot" style={{ background: model.color }} />
                  <div className="model-picker-info">
                    <span className="model-picker-name">{model.name}</span>
                    <span className="model-picker-type">{model.type}</span>
                  </div>
                  {activeModel === model.id && <HiOutlineCheck className="model-picker-check" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <StatCard
          icon={HiOutlineLightningBolt}
          iconColor="amber"
          label="Automation Speed"
          value="Fast"
          sub="Lag-Free Polling"
          tag="OPTIMIZED"
          tagType="optimized"
        />
      </div>

      {/* Analytics SVG Graph Row */}
      <div className="glass-card dashboard-analytics-card accent-border-indigo stagger">
        <div className="analytics-header">
          <div className="analytics-header-title">
            <HiOutlineTrendingUp className="analytics-icon" />
            <div>
              <h4>Channel Growth Analytics</h4>
              <p>Weekly views reach growth across automated Instagram & YouTube pipelines</p>
            </div>
          </div>
          <div className="analytics-metrics">
            <div className="metric-pill">
              <span className="metric-dot pink"></span>
              <span>Reach: <strong style={{ color: 'var(--pink)' }}>+142%</strong></span>
            </div>
            <div className="metric-pill">
              <span className="metric-dot indigo"></span>
              <span>Processed: <strong>{totalReelDrafts + 12} Reels</strong></span>
            </div>
          </div>
        </div>
        <div className="analytics-chart-container">
          <svg className="analytics-svg-chart" viewBox="0 0 500 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chart-grad-pink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            {/* Chart Area Gradient */}
            <path d="M 0,120 L 0,85 Q 50,75 100,90 T 200,60 T 300,45 T 400,30 Q 450,15 500,20 L 500,120 Z" fill="url(#chart-grad-pink)" />
            {/* Chart line */}
            <path d="M 0,85 Q 50,75 100,90 T 200,60 T 300,45 T 400,30 Q 450,15 500,20" fill="none" stroke="url(#chart-line-grad)" strokeWidth="3" strokeLinecap="round" />
            {/* Interactive graph dots */}
            <circle cx="100" cy="90" r="4" fill="#6366f1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <circle cx="200" cy="60" r="4" fill="#8b5cf6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <circle cx="300" cy="45" r="4" fill="#8b5cf6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
            <circle cx="450" cy="15" r="5" fill="#ec4899" stroke="rgba(255,255,255,1)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px #ec4899)' }} />
          </svg>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="glass-card dashboard-cta accent-border-indigo stagger">
        <div className="dashboard-cta-text">
          <h3>Ready for Automated Growth?</h3>
          <p>
            Your AI agents are trained on your editing styles and presets. Run global automation to orchestrate publishing and capture viral engagement 24/7.
          </p>
        </div>
        <Link to="/reel-automation" className="gradient-btn">
          Design AI Reels <HiOutlineArrowRight />
        </Link>
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-bottom stagger">
        <div className="glass-card feature-card accent-border-sky">
          <div className="feature-card-header-row">
            <div className="feature-card-icon blue">
              <HiOutlineChatAlt2 />
            </div>
            <span className="live-pill">LIVE MONITOR</span>
          </div>
          <h4>Instagram DM Agent</h4>
          <p>Reply to customers automatically using local AI models with aesthetic tone rules.</p>
          
          {/* Simulated Chat Live Widget */}
          <div className="simulated-chat-widget">
            <div className="chat-bubble user">How can I sync accounts?</div>
            <div className="chat-bubble agent">✨ Connect them in Accounts tab! 🤍</div>
          </div>
          
          <Link to="/instagram-dm" className="feature-card-link">
            Go to Automation <HiOutlineArrowRight />
          </Link>
        </div>

        <div className="glass-card feature-card accent-border-success">
          <div className="feature-card-header-row">
            <div className="feature-card-icon emerald">
              <HiOutlineFilm />
            </div>
            <span className="live-pill active">AUTONOMOUS</span>
          </div>
          <h4>Reel Production Engine</h4>
          <p>Search, generate, composite typography frames, and compile high-retention video files.</p>
          
          {/* Blueprints preview items */}
          <div className="dashboard-blueprints-preview">
            <div className="bp-item active">
              <span className="bp-dot pink"></span>
              <span>Lyrics Preset</span>
              <small>ACTIVE</small>
            </div>
            <div className="bp-item">
              <span className="bp-dot purple"></span>
              <span>Classic Quote</span>
              <small>STANDBY</small>
            </div>
          </div>
          
          <Link to="/reel-automation" className="feature-card-link">
            Go to Production <HiOutlineArrowRight />
          </Link>
        </div>

        <div className="glass-card health-panel">
          <div className="health-panel-header">
            <HiOutlineShieldCheck className="health-panel-header-icon" />
            <h4>System Topology Health</h4>
          </div>
          <div className="health-services-list">
            {systemStatus?.services?.map((service, i) => (
              <div className="health-item" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`status-glow-light ${service.status === 'healthy' || service.status === 'online' || service.status === 'ready' || service.status === 'active' || service.status === 'configured' ? 'healthy' : service.status === 'offline' ? 'offline' : 'warn'}`}></span>
                  <span className="health-item-name">{service.name}</span>
                </div>
                <StatusBadge status={service.status} label={service.label} />
              </div>
            ))}
          </div>
          <div className="health-tip">
            <HiOutlineTerminal className="tip-icon" />
            <span><strong>TIP:</strong> Switch model to Ollama (Local) for 10x faster frame rendering without key latency.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
