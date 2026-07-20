import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineChip,
  HiOutlineLightningBolt,
  HiOutlineChatAlt2,
  HiOutlineFilm,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineSwitchHorizontal,
  HiOutlineCheck,
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
      <div className="dashboard-banner stagger">
        <div className="banner-visual-bg"></div>
        <div className="banner-meta-grid">
          <div className="avatar-orb-main animate-pulse-glow">
            <span className="user-glow-avatar">{user?.initials || 'A'}</span>
          </div>
          <div className="welcome-headline-text">
            <h2>Welcome back, {user?.name || 'Abhay Gupta'}!</h2>
            <p>Your AI Agent pipelines are running healthy and active.</p>
          </div>
        </div>
        <div className="banner-actions">
          <button className="banner-control-btn border-emerald" style={{ color: 'var(--success)' }}>
            <span className="live-badge-glow"></span>
            Agent Core Active
          </button>
        </div>
      </div>

      {/* Statistics Section Grid */}
      <div className="dashboard-stats-grid">
        <StatCard
          icon={HiOutlineUserGroup}
          iconColor="purple"
          label="Active Accounts"
          value={`${activeIgCount} / ${connectedAccounts.instagram.length}`}
          sub="Instagram Live Nodes"
          tag={activeIgCount > 0 ? "STABLE" : "OFFLINE"}
          tagType={activeIgCount > 0 ? "healthy" : "offline"}
        />

        <StatCard
          icon={HiOutlineFilm}
          iconColor="pink"
          label="Automated Reel Drafts"
          value={totalReelDrafts.toString()}
          sub="Compiled Media Assets"
          tag="READY"
          tagType="healthy"
        />

        <div className="glass-card stat-card accent-border-indigo stagger">
          <div className="stat-card-meta">
            <div className="stat-card-icon-wrapper bg-indigo-glow text-indigo">
              <HiOutlineChip />
            </div>
            <div className="stat-card-labels">
              <span>Active AI Model</span>
              <h3>{currentModel?.name || 'Gemini 2.0 Flash'}</h3>
              <p>{currentModel?.provider || 'Google Cloud'}</p>
            </div>
          </div>
          <button className="stat-card-action-btn mt-3" onClick={() => setShowModelPicker(!showModelPicker)}>
            <HiOutlineSwitchHorizontal /> Change Model
          </button>

          {showModelPicker && (
            <div className="dashboard-model-picker-dropdown">
              {AI_MODELS.map((model) => (
                <div
                  key={model.id}
                  className={`model-option-item ${activeModel === model.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveModel(model.id);
                    setShowModelPicker(false);
                  }}
                >
                  <div className="model-option-meta">
                    <strong>{model.name}</strong>
                    <span>{model.type}</span>
                  </div>
                  {activeModel === model.id && <HiOutlineCheck className="text-emerald" />}
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

      {/* Recent Automated Reels Output Section */}
      <div className="glass-card dashboard-reels-section accent-border-pink stagger" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center' }}>
              <HiOutlineFilm style={{ fontSize: '1.4rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Automated Reels Output</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>Live generated reels ready for download and social publishing</p>
            </div>
          </div>
          <Link to="/reel-automation" className="secondary-btn" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            View All ({totalReelDrafts}) <HiOutlineArrowRight />
          </Link>
        </div>

        {(() => {
          const allGeneratedReels = Object.entries(blueprints || {}).flatMap(([key, bp]) => 
            (bp?.generated || []).map(g => ({ ...g, blueprint: key }))
          );

          if (allGeneratedReels.length === 0) {
            return (
              <div style={{ textTransform: 'none', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#9ca3af', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <HiOutlineFilm style={{ fontSize: '2rem', color: '#ec4899', marginBottom: '8px', opacity: 0.8 }} />
                <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: '4px' }}>No Reels Generated Yet</div>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Click "Design AI Reels" below to generate your first aesthetic reel.</p>
              </div>
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {allGeneratedReels.slice(0, 3).map((reel, idx) => (
                <div key={reel.id || idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HiOutlineFilm style={{ color: '#ec4899' }} /> {reel.name}
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>RENDERED</span>
                  </div>

                  {reel.videoUrl ? (
                    <video 
                      src={reel.videoUrl} 
                      controls 
                      style={{ width: '100%', height: '160px', borderRadius: '10px', objectFit: 'cover', background: '#000' }} 
                    />
                  ) : (
                    <div style={{ height: '160px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', fontSize: '0.8rem', padding: '12px', textTransform: 'uppercase', fontFamily: "'Caveat', cursive", textAlign: 'center' }}>
                      {reel.lyricsSnapshot ? reel.lyricsSnapshot.substring(0, 50) + '...' : 'Aesthetic Lyric Reel'}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{reel.date || 'Today'}</span>
                    {reel.videoUrl && (
                      <a 
                        href={reel.videoUrl} 
                        download 
                        className="gradient-btn" 
                        style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
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
