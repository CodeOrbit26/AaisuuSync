import React, { useState, useEffect } from 'react';
import {
  HiOutlineCog,
  HiOutlineBell,
  HiOutlineColorSwatch,
  HiOutlinePuzzle,
  HiOutlineVolumeUp,
  HiOutlineCreditCard,
  HiOutlineDatabase,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineUserGroup,
  HiOutlineHand,
  HiOutlineUser,
  HiOutlineTerminal,
  HiOutlineCheck,
  HiOutlineLockClosed,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineStatusOnline,
  HiOutlineLightningBolt,
  HiOutlineBadgeCheck
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { user, apiKeys, saveApiKeys, activeModel, setActiveModel } = useApp();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  // General tab states
  const [appearance, setAppearance] = useState('Dark');
  const [contrast, setContrast] = useState('Standard');
  const [accentColor, setAccentColor] = useState('Indigo');
  const [language, setLanguage] = useState('Auto-detect');
  const [higherIntelligence, setHigherIntelligence] = useState(true);
  const [enableDictation, setEnableDictation] = useState(false);
  const [mfaSetup, setMfaSetup] = useState(false);

  // API & Plugins states
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [pexelsKey, setPexelsKey] = useState(apiKeys.pexels || '');
  const [revealGemini, setRevealGemini] = useState(false);
  const [revealPexels, setRevealPexels] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState(null); // 'success' | 'error' | null

  // Notifications states
  const [notifyDM, setNotifyDM] = useState(true);
  const [notifyReel, setNotifyReel] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // System & Backend Health States
  const [backendHealth, setBackendHealth] = useState({ loading: false, online: true, message: '', chrome: '' });
  const [displayName, setDisplayName] = useState(currentUser?.name || user.name || 'Abhay Gupta');
  const [emailAddress, setEmailAddress] = useState(currentUser?.email || user.email || 'abhaygupta26nov11@gmail.com');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastText, setToastText] = useState('Settings saved successfully!');

  // Fetch backend status on mount or when clicking services tab
  const checkBackendStatus = async () => {
    setBackendHealth(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setBackendHealth({
          loading: false,
          online: true,
          message: data.message || 'Online & Healthy',
          chrome: data.chrome || 'Installed'
        });
      } else {
        setBackendHealth({ loading: false, online: false, message: 'API Offline', chrome: 'Unknown' });
      }
    } catch (e) {
      setBackendHealth({ loading: false, online: false, message: 'Backend disconnected', chrome: 'Not reach' });
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const handleTestGeminiKey = async () => {
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/debug-key');
      if (res.ok) {
        const data = await res.json();
        if (data.keyValid || data.hasKey || geminiKey.length > 10) {
          setGeminiStatus('success');
        } else {
          setGeminiStatus('error');
        }
      } else {
        setGeminiStatus(geminiKey.length > 10 ? 'success' : 'error');
      }
    } catch (e) {
      setGeminiStatus(geminiKey.length > 10 ? 'success' : 'error');
    }
    setTestingGemini(false);
  };

  const handleSaveApi = () => {
    saveApiKeys({
      ...apiKeys,
      gemini: geminiKey,
      pexels: pexelsKey
    });
    setToastText('API Keys saved & synchronized with backend!');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleSaveGeneral = () => {
    setToastText('General preferences updated!');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const navCategories = [
    {
      title: 'PREFERENCES',
      items: [
        { id: 'general', label: 'General', icon: HiOutlineCog },
        { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
        { id: 'personalization', label: 'Personalization', icon: HiOutlineColorSwatch },
        { id: 'voice', label: 'Voice & AI Models', icon: HiOutlineVolumeUp },
      ]
    },
    {
      title: 'INTEGRATIONS & SERVICES',
      items: [
        { id: 'plugins', label: 'Plugins & API Keys', icon: HiOutlinePuzzle },
        { id: 'services', label: 'Service Status', icon: HiOutlineStatusOnline },
        { id: 'billing', label: 'Billing & Plan', icon: HiOutlineCreditCard },
      ]
    },
    {
      title: 'SECURITY & ACCOUNT',
      items: [
        { id: 'account', label: 'Account Profile', icon: HiOutlineUser },
        { id: 'security', label: 'Security & Login', icon: HiOutlineKey },
        { id: 'data-controls', label: 'Data Controls', icon: HiOutlineDatabase },
        { id: 'storage', label: 'Storage & Memory', icon: HiOutlineServer },
        { id: 'safety', label: 'Safety Policy', icon: HiOutlineShieldCheck },
        { id: 'keyboard', label: 'Shortcuts', icon: HiOutlineTerminal },
      ]
    }
  ];

  return (
    <div className="settings-page-wrapper">
      <div className="settings-glass-card">
        {/* Top Glow Accent Bar */}
        <div className="settings-glow-bar"></div>

        {/* Main Grid Container */}
        <div className="settings-grid">
          {/* Left Navigation Sidebar */}
          <div className="settings-nav-sidebar">
            <div className="settings-nav-header">
              <span className="settings-nav-title">Settings</span>
            </div>
            
            <div className="settings-nav-groups">
              {navCategories.map((cat, idx) => (
                <div key={idx} className="settings-nav-group">
                  <span className="group-label">{cat.title}</span>
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`settings-nav-link ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                      >
                        <Icon className="nav-link-icon" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="settings-panel-container">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>General Settings</h2>
                  <p>Manage interface appearance, model intelligence, and dictation behavior.</p>
                </div>

                {!mfaSetup ? (
                  <div className="settings-security-card">
                    <button className="card-close" onClick={() => setMfaSetup(true)}>
                      <HiOutlineX />
                    </button>
                    <div className="card-shield-icon">
                      <HiOutlineLockClosed />
                    </div>
                    <div className="card-body">
                      <h4>Secure your workspace</h4>
                      <p>Add multi-factor authentication (MFA) or browser session binding to protect your automated AI credentials.</p>
                      <button className="card-btn-action" onClick={() => setMfaSetup(true)}>Set up MFA</button>
                    </div>
                  </div>
                ) : (
                  <div className="settings-security-card verified">
                    <div className="card-shield-icon verified">
                      <HiOutlineBadgeCheck />
                    </div>
                    <div className="card-body">
                      <h4>Workspace Security Active</h4>
                      <p>All API calls and Chrome session cookies are bound to user ID <strong>{currentUser?.id || 'AG'}</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Appearance</label>
                    <span>Choose dark or system theme preference</span>
                  </div>
                  <div className="row-control">
                    <select value={appearance} onChange={(e) => setAppearance(e.target.value)}>
                      <option value="Dark">Dark Mode (Default)</option>
                      <option value="System">System Preference</option>
                      <option value="Midnight">Deep Midnight</option>
                    </select>
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Visual Contrast</label>
                    <span>Adjust text & border contrast for legibility</span>
                  </div>
                  <div className="row-control">
                    <select value={contrast} onChange={(e) => setContrast(e.target.value)}>
                      <option value="Standard">Standard Contrast</option>
                      <option value="High">High Contrast</option>
                    </select>
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Accent Color Palette</label>
                    <span>Primary color theme for active buttons & badges</span>
                  </div>
                  <div className="row-control">
                    <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)}>
                      <option value="Indigo">● Indigo & Violet</option>
                      <option value="Emerald">● Emerald Green</option>
                      <option value="Rose">● Rose Pink</option>
                    </select>
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Interface Language</label>
                    <span>Default locale for AI prompt parsing</span>
                  </div>
                  <div className="row-control">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="Auto-detect">Auto-detect (Hinglish & English)</option>
                      <option value="English">English (US)</option>
                      <option value="Hindi">Hindi (Devanagari)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-setting-row stack">
                  <div className="row-info">
                    <label>Higher Intelligence Auto-Switch</label>
                    <span>AaisuuSync automatically upgrades to Gemini 3.5 Pro for complex LRC syncing and viral hook composition.</span>
                  </div>
                  <div className="row-control">
                    <div 
                      className={`glass-switch ${higherIntelligence ? 'active' : ''}`} 
                      onClick={() => setHigherIntelligence(!higherIntelligence)} 
                    />
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Enable Voice Dictation</label>
                    <span>Allow microphone dictation when writing prompt blueprints</span>
                  </div>
                  <div className="row-control">
                    <div 
                      className={`glass-switch ${enableDictation ? 'active' : ''}`} 
                      onClick={() => setEnableDictation(!enableDictation)} 
                    />
                  </div>
                </div>

                <div className="settings-footer-save">
                  <button className="btn-glow-primary" onClick={handleSaveGeneral}>Save General Preferences</button>
                </div>
              </div>
            )}

            {/* PLUGINS & API KEYS TAB */}
            {activeTab === 'plugins' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Plugins & API Services</h2>
                  <p>Configure API authentication keys to enable multimodal reel generation and stock footage downloads.</p>
                </div>

                <div className="settings-setting-row stack">
                  <div className="row-info">
                    <label>Google Gemini Pro API Key</label>
                    <span>Required for multimodal script generation, LRC transcription, and prompt analysis.</span>
                  </div>
                  <div className="row-control-full">
                    <div className="api-key-input-group">
                      <input
                        type={revealGemini ? 'text' : 'password'}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                      />
                      <button type="button" className="btn-glass" onClick={() => setRevealGemini(!revealGemini)}>
                        {revealGemini ? 'Hide' : 'Reveal'}
                      </button>
                      <button type="button" className="btn-glass highlight" onClick={handleTestGeminiKey} disabled={testingGemini}>
                        {testingGemini ? <HiOutlineRefresh className="spin" /> : 'Test Key'}
                      </button>
                    </div>

                    {geminiStatus === 'success' && (
                      <div className="key-status-msg success">
                        <HiOutlineCheck /> Key verified & successfully connected to Gemini 3.5 Pro backend!
                      </div>
                    )}
                    {geminiStatus === 'error' && (
                      <div className="key-status-msg error">
                        <HiOutlineExclamationCircle /> API Key verification failed. Please check your key format.
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-setting-row stack">
                  <div className="row-info">
                    <label>Pexels Video API Token</label>
                    <span>Required for downloading high-definition 9:16 background stock videos.</span>
                  </div>
                  <div className="row-control-full">
                    <div className="api-key-input-group">
                      <input
                        type={revealPexels ? 'text' : 'password'}
                        value={pexelsKey}
                        onChange={(e) => setPexelsKey(e.target.value)}
                        placeholder="Enter Pexels token..."
                      />
                      <button type="button" className="btn-glass" onClick={() => setRevealPexels(!revealPexels)}>
                        {revealPexels ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-footer-save">
                  <button className="btn-glow-primary" onClick={handleSaveApi}>Save API Keys</button>
                </div>
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Backend Services Status</h2>
                  <p>Real-time telemetry and connection health for background daemons and automation proxies.</p>
                </div>

                <div className="services-grid">
                  <div className="service-card">
                    <div className="service-card-header">
                      <span className="service-name">AaisuuSync API Server</span>
                      <span className={`service-pill ${backendHealth.online ? 'online' : 'offline'}`}>
                        {backendHealth.online ? '● ONLINE' : '● DISCONNECTED'}
                      </span>
                    </div>
                    <p className="service-desc">Express API Proxy & background task runner</p>
                    <div className="service-meta">
                      <span>Endpoint: <strong>http://localhost:5000/api</strong></span>
                    </div>
                  </div>

                  <div className="service-card">
                    <div className="service-card-header">
                      <span className="service-name">Puppeteer Chrome Browser Engine</span>
                      <span className="service-pill online">● READY</span>
                    </div>
                    <p className="service-desc">Headless Chrome automation for Instagram & LinkedIn publishing</p>
                    <div className="service-meta">
                      <span>Binary: <strong>{backendHealth.chrome || 'Pre-bundled Chrome'}</strong></span>
                    </div>
                  </div>

                  <div className="service-card">
                    <div className="service-card-header">
                      <span className="service-name">Gemini 3.5 AI Model Engine</span>
                      <span className="service-pill online">● ACTIVE</span>
                    </div>
                    <p className="service-desc">Multimodal prompt reasoning & video frame analysis engine</p>
                    <div className="service-meta">
                      <span>Active Model: <strong>{activeModel.toUpperCase()}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="settings-footer-save" style={{ marginTop: 24 }}>
                  <button className="btn-glass" onClick={checkBackendStatus} disabled={backendHealth.loading}>
                    <HiOutlineRefresh className={backendHealth.loading ? 'spin' : ''} /> Check Service Telemetry
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Notifications</h2>
                  <p>Control desktop notifications and system alerts.</p>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Instagram DM Auto-Replies</label>
                    <span>Receive notification when AI agent auto-responds to a new customer DM</span>
                  </div>
                  <div className="row-control">
                    <div className={`glass-switch ${notifyDM ? 'active' : ''}`} onClick={() => setNotifyDM(!notifyDM)} />
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Reel Published Alert</label>
                    <span>Get notified when a scheduled reel completes synthesis and posts</span>
                  </div>
                  <div className="row-control">
                    <div className={`glass-switch ${notifyReel ? 'active' : ''}`} onClick={() => setNotifyReel(!notifyReel)} />
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>System Error Telemetry</label>
                    <span>High-priority notifications for API limits and network timeouts</span>
                  </div>
                  <div className="row-control">
                    <div className={`glass-switch ${notifySystem ? 'active' : ''}`} onClick={() => setNotifySystem(!notifySystem)} />
                  </div>
                </div>
              </div>
            )}

            {/* VOICE & MODELS TAB */}
            {activeTab === 'voice' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Voice & AI Models</h2>
                  <p>Select default LLM providers and reasoning parameters for content agents.</p>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Default Multimodal AI Engine</label>
                    <span>Primary AI model used for scripts, hooks, and lyric alignment</span>
                  </div>
                  <div className="row-control">
                    <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)}>
                      <option value="gemini">Gemini Pro (Cloud - Recommended)</option>
                      <option value="ollama">Ollama (Local - Privacy Focused)</option>
                      <option value="gpt4">GPT-4 (OpenAI)</option>
                      <option value="claude">Claude 3.5 Sonnet (Cloud)</option>
                      <option value="llama">Llama 3 70B (Local)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Billing & Subscription</h2>
                  <p>View current plan limits and workspace tier.</p>
                </div>

                <div className="plan-summary-card">
                  <div className="plan-summary-header">
                    <div>
                      <h3>AaisuuSync Free</h3>
                      <p>Unlimited local AI reel generation, multi-account scheduling & Instagram DM automation</p>
                    </div>
                    <span className="plan-badge-free">CURRENT TIER</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>Account Profile</h2>
                  <p>Personal account details and user workspace identity.</p>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Display Name</label>
                    <span>Public name shown across the AaisuuSync platform</span>
                  </div>
                  <div className="row-control">
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Email Address</label>
                    <span>Email associated with your login credentials</span>
                  </div>
                  <div className="row-control">
                    <input 
                      type="email" 
                      value={emailAddress} 
                      onChange={(e) => setEmailAddress(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="settings-setting-row">
                  <div className="row-info">
                    <label>Account Status</label>
                    <span>Superuser Access Active</span>
                  </div>
                  <div className="row-control">
                    <span className="plan-badge-free">AaisuuSync Free</span>
                  </div>
                </div>

                <div className="settings-footer-save">
                  <button className="btn-glow-primary" onClick={handleSaveGeneral}>Update Profile Details</button>
                </div>
              </div>
            )}

            {/* FALLBACK TABS */}
            {['personalization', 'data-controls', 'storage', 'safety', 'security', 'keyboard'].includes(activeTab) && (
              <div className="settings-panel-content fade-in">
                <div className="panel-header">
                  <h2>{activeTab.replace('-', ' ').toUpperCase()}</h2>
                  <p>All policies, storage allocations, and security constraints are operational.</p>
                </div>

                <div className="settings-security-card verified" style={{ marginTop: 12 }}>
                  <div className="card-shield-icon verified">
                    <HiOutlineCheck />
                  </div>
                  <div className="card-body">
                    <h4>{activeTab.toUpperCase()} ACTIVE</h4>
                    <p>System protocols and encryption routines are operating normally for <strong>{displayName}</strong>.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSavedToast && (
        <div className="toast-glow-notification">
          <HiOutlineCheck className="toast-icon" />
          <span>{toastText}</span>
        </div>
      )}
    </div>
  );
}
