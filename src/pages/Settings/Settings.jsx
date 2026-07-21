import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineGlobeAlt,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineChip,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { user, apiKeys, saveApiKeys, activeModel, setActiveModel, systemStatus } = useApp();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const uid = currentUser?.id || '';
  const uk = (key) => uid ? `${uid}_${key}` : key;

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(uk('aaisuu_active_tab_settings')) || 'profile';
  });

  React.useEffect(() => {
    localStorage.setItem(uk('aaisuu_active_tab_settings'), activeTab);
  }, [activeTab, uid]);

  // Form States
  const [displayName, setDisplayName] = useState(user.name || 'Abhay Gupta');
  const [emailAddress, setEmailAddress] = useState(user.email || 'abhaygupta26nov11@gmail.com');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');

  // API Key States
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [pexelsKey, setPexelsKey] = useState(apiKeys.pexels || '');
  const [revealGemini, setRevealGemini] = useState(false);
  const [revealPexels, setRevealPexels] = useState(false);

  // Notification Toggles
  const [notifyDM, setNotifyDM] = useState(true);
  const [notifyReel, setNotifyReel] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // System Configs
  const [autoBackup, setAutoBackup] = useState(true);
  const [pollingInterval, setPollingInterval] = useState('Every 15 Minutes');

  // UI Toast
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const handleSave = () => {
    saveApiKeys({
      ...apiKeys,
      gemini: geminiKey,
      pexels: pexelsKey
    });
    setShowSavedNotification(true);
    setTimeout(() => {
      setShowSavedNotification(false);
    }, 3000);
  };

  const handleReset = () => {
    setGeminiKey(apiKeys.gemini || '');
    setPexelsKey(apiKeys.pexels || '');
    setDisplayName(user.name || 'Abhay Gupta');
    setEmailAddress(user.email || 'abhaygupta26nov11@gmail.com');
  };

  const handleExportData = () => {
    const exportPayload = {
      user: { name: displayName, email: emailAddress },
      apiKeys: { gemini: geminiKey ? '***MASKED***' : '', pexels: pexelsKey ? '***MASKED***' : '' },
      activeModel,
      notifications: { notifyDM, notifyReel, notifySystem },
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aaisuusync_settings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="settings-container page-container">
      {/* Top Page Header Row */}
      <div className="page-header-row">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back" title="Go back">
          <HiOutlineArrowLeft />
        </button>
        <span className="page-header-context-title">Back to Dashboard</span>
      </div>

      {/* Top Banner Header */}
      <div className="settings-banner-card">
        <div className="settings-user-profile-hero">
          <div className="settings-avatar-large">
            {user.initials || 'AG'}
          </div>
          <div className="settings-user-meta">
            <div className="settings-user-name-row">
              <h3>{displayName}</h3>
              <span className="settings-free-badge">{user.plan || 'AaisuuSync Free'}</span>
              <span className="settings-status-chip">
                <span className="chip-dot"></span> Active
              </span>
            </div>
            <p className="settings-user-email">{emailAddress}</p>
          </div>
        </div>

        <div className="settings-quick-stats">
          <div className="quick-stat-pill">
            <HiOutlineChip className="stat-icon gemini" />
            <div>
              <span className="stat-label">AI Engine</span>
              <span className="stat-value">{activeModel.toUpperCase()}</span>
            </div>
          </div>
          <div className="quick-stat-pill">
            <HiOutlineKey className="stat-icon keys" />
            <div>
              <span className="stat-label">API Status</span>
              <span className="stat-value">{geminiKey ? 'Configured' : 'Missing Key'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Content Split */}
      <div className="settings-layout">
        {/* Sub-tabs Navigation */}
        <div className="settings-nav-sidebar">
          <button 
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <HiOutlineUser className="nav-icon" />
            <span>Profile & Account</span>
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <HiOutlineKey className="nav-icon" />
            <span>API & AI Inference</span>
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <HiOutlineBell className="nav-icon" />
            <span>Notification Rules</span>
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <HiOutlineCog className="nav-icon" />
            <span>System & Engine</span>
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <HiOutlineShieldCheck className="nav-icon" />
            <span>Privacy & Isolation</span>
          </button>
        </div>

        {/* Settings Content Panels */}
        <div className="settings-content-panel">

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="settings-card fade-in">
              <div className="settings-card-header">
                <div>
                  <h3>Profile & Identity</h3>
                  <p>Manage your account name, contact email, and workspace preferences</p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label htmlFor="display-name">Display Name</label>
                  <div className="settings-input-icon-wrapper">
                    <HiOutlineUser className="field-icon" />
                    <input 
                      id="display-name"
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label htmlFor="email-address">Email Address</label>
                  <div className="settings-input-icon-wrapper">
                    <HiOutlineMail className="field-icon" />
                    <input 
                      id="email-address"
                      type="email" 
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label htmlFor="timezone-select">Default Timezone</label>
                  <div className="settings-input-icon-wrapper">
                    <HiOutlineGlobeAlt className="field-icon" />
                    <select 
                      id="timezone-select"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+5:30)</option>
                      <option value="America/New_York (EST)">America/New_York (EST - UTC-5:00)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT - UTC+0:00)</option>
                      <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST - UTC-8:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API & AI INFERENCE */}
          {activeTab === 'api' && (
            <div className="settings-card fade-in">
              <div className="settings-card-header">
                <div>
                  <h3>API Credentials & Inference Engine</h3>
                  <p>Configure keys for Google Gemini, stock media providers, and active LLM models</p>
                </div>
              </div>

              <div className="settings-api-stack">
                {/* Gemini Key */}
                <div className="api-key-box">
                  <div className="api-key-box-header">
                    <div className="api-key-title-group">
                      <div className="api-provider-icon gemini">
                        <HiOutlineSparkles />
                      </div>
                      <div>
                        <h4>Google Gemini API Key</h4>
                        <span className="api-provider-sub">Required for Reel scripts, LRC lyrics transcription & captions</span>
                      </div>
                    </div>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="api-external-link"
                    >
                      <span>Get Key</span>
                      <HiOutlineExternalLink />
                    </a>
                  </div>

                  <div className="api-key-input-row">
                    <input 
                      type={revealGemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                    <button 
                      type="button" 
                      className="api-toggle-btn"
                      onClick={() => setRevealGemini(!revealGemini)}
                    >
                      {revealGemini ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                      <span>{revealGemini ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>

                {/* Pexels Key */}
                <div className="api-key-box">
                  <div className="api-key-box-header">
                    <div className="api-key-title-group">
                      <div className="api-provider-icon pexels">
                        <HiOutlineChip />
                      </div>
                      <div>
                        <h4>Pexels Stock Media API Key</h4>
                        <span className="api-provider-sub">Used for fetching background video loops and HD stock clips</span>
                      </div>
                    </div>
                    <a 
                      href="https://www.pexels.com/api/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="api-external-link"
                    >
                      <span>Get Token</span>
                      <HiOutlineExternalLink />
                    </a>
                  </div>

                  <div className="api-key-input-row">
                    <input 
                      type={revealPexels ? 'text' : 'password'}
                      value={pexelsKey}
                      onChange={(e) => setPexelsKey(e.target.value)}
                      placeholder="Pexels authorization token..."
                    />
                    <button 
                      type="button" 
                      className="api-toggle-btn"
                      onClick={() => setRevealPexels(!revealPexels)}
                    >
                      {revealPexels ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                      <span>{revealPexels ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Model Selector */}
                <div className="settings-field-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="ai-model-select">Active AI Inference Model</label>
                  <select 
                    id="ai-model-select"
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value)}
                    className="settings-model-selector"
                  >
                    <option value="gemini">Gemini Pro (Cloud — Ultra Fast)</option>
                    <option value="ollama">Ollama (Local Node — Privacy First)</option>
                    <option value="gpt4">GPT-4 (OpenAI Cloud)</option>
                    <option value="claude">Claude 3.5 Sonnet (Cloud)</option>
                    <option value="llama">Llama 3 (Local Node)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="settings-card fade-in">
              <div className="settings-card-header">
                <div>
                  <h3>Automation Alerts & Notifications</h3>
                  <p>Choose when and how AaisuuSync alerts you regarding pipeline actions</p>
                </div>
              </div>

              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div className="toggle-row-left">
                    <h4>Direct Message Notifications</h4>
                    <p>Receive alerts when Instagram AI auto-responder sends a reply to a lead</p>
                  </div>
                  <div 
                    className={`settings-custom-switch ${notifyDM ? 'active' : ''}`}
                    onClick={() => setNotifyDM(!notifyDM)}
                  >
                    <div className="switch-thumb"></div>
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-row-left">
                    <h4>Reel Publication Alerts</h4>
                    <p>Trigger notification every time a synthesized reel is successfully published</p>
                  </div>
                  <div 
                    className={`settings-custom-switch ${notifyReel ? 'active' : ''}`}
                    onClick={() => setNotifyReel(!notifyReel)}
                  >
                    <div className="switch-thumb"></div>
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-row-left">
                    <h4>Critical System Alerts</h4>
                    <p>High-priority notifications for Chrome session drops or API rate limit warnings</p>
                  </div>
                  <div 
                    className={`settings-custom-switch ${notifySystem ? 'active' : ''}`}
                    onClick={() => setNotifySystem(!notifySystem)}
                  >
                    <div className="switch-thumb"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM & ENGINE */}
          {activeTab === 'system' && (
            <div className="settings-card fade-in">
              <div className="settings-card-header">
                <div>
                  <h3>System & Daemon Engine Controls</h3>
                  <p>Fine-tune background workers, auto-backup intervals, and data exports</p>
                </div>
              </div>

              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div className="toggle-row-left">
                    <h4>Automatic Config Backup</h4>
                    <p>Periodically back up AI blueprints, custom prompts, and rule sets to browser storage</p>
                  </div>
                  <div 
                    className={`settings-custom-switch ${autoBackup ? 'active' : ''}`}
                    onClick={() => setAutoBackup(!autoBackup)}
                  >
                    <div className="switch-thumb"></div>
                  </div>
                </div>

                <div className="settings-field-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="polling-select">Worker Daemon Polling Interval</label>
                  <select 
                    id="polling-select"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(e.target.value)}
                  >
                    <option value="Every 5 Minutes">Every 5 Minutes (High Speed)</option>
                    <option value="Every 15 Minutes">Every 15 Minutes (Balanced — Recommended)</option>
                    <option value="Every 30 Minutes">Every 30 Minutes</option>
                    <option value="Every 1 Hour">Every 1 Hour</option>
                  </select>
                </div>

                <div className="export-data-card">
                  <div>
                    <h4>Export Workspace Data</h4>
                    <p>Download a JSON backup of your current setup, prompts, and preferences</p>
                  </div>
                  <button type="button" className="export-btn" onClick={handleExportData}>
                    <HiOutlineDownload />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & ISOLATION */}
          {activeTab === 'security' && (
            <div className="settings-card fade-in">
              <div className="settings-card-header">
                <div>
                  <h3>Privacy & Per-User Isolation</h3>
                  <p>Security guarantees for user data, local storage keys, and Chrome automation profiles</p>
                </div>
              </div>

              <div className="security-badges-grid">
                <div className="security-card">
                  <HiOutlineCheckCircle className="security-card-icon" />
                  <h4>Isolated User Storage</h4>
                  <p>Your API keys and connected accounts are strictly prefixed with your unique User ID.</p>
                </div>

                <div className="security-card">
                  <HiOutlineCheckCircle className="security-card-icon" />
                  <h4>Local Chrome Data</h4>
                  <p>Puppeteer automation profiles remain stored in your local server cache directory.</p>
                </div>

                <div className="security-card">
                  <HiOutlineCheckCircle className="security-card-icon" />
                  <h4>Encrypted Sessions</h4>
                  <p>Active user session tokens expire cleanly upon explicit logout action.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Action Save Bar */}
          <div className="settings-action-bar">
            <button 
              type="button" 
              className="action-reset-btn"
              onClick={handleReset}
            >
              <HiOutlineRefresh />
              <span>Reset Changes</span>
            </button>

            <button 
              type="button" 
              className="action-save-btn"
              onClick={handleSave}
            >
              <HiOutlineCheck />
              <span>Save Settings</span>
            </button>
          </div>

        </div>
      </div>

      {/* Floating Save Toast */}
      {showSavedNotification && (
        <div className="settings-toast-notification">
          <HiOutlineCheckCircle className="toast-icon" />
          <span>Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
}
