import React, { useState } from 'react';
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
  HiOutlineX
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './Settings.css';

export default function Settings() {
  const { user, apiKeys, saveApiKeys, activeModel, setActiveModel } = useApp();
  const [activeTab, setActiveTab] = useState('general');

  // General tab states
  const [appearance, setAppearance] = useState('System');
  const [contrast, setContrast] = useState('System');
  const [accentColor, setAccentColor] = useState('Default');
  const [language, setLanguage] = useState('Auto-detect');
  const [higherIntelligence, setHigherIntelligence] = useState(true);
  const [enableDictation, setEnableDictation] = useState(false);
  const [mfaSetup, setMfaSetup] = useState(false);

  // API & Plugins states
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [pexelsKey, setPexelsKey] = useState(apiKeys.pexels || '');
  const [revealGemini, setRevealGemini] = useState(false);
  const [revealPexels, setRevealPexels] = useState(false);

  // Notifications states
  const [notifyDM, setNotifyDM] = useState(true);
  const [notifyReel, setNotifyReel] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // System/Security states
  const [autoBackup, setAutoBackup] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const handleSaveApi = () => {
    saveApiKeys({
      ...apiKeys,
      gemini: geminiKey,
      pexels: pexelsKey
    });
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  const navItems = [
    { id: 'general', label: 'General', icon: HiOutlineCog },
    { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
    { id: 'personalization', label: 'Personalization', icon: HiOutlineColorSwatch },
    { id: 'plugins', label: 'Plugins & API Keys', icon: HiOutlinePuzzle },
    { id: 'voice', label: 'Voice & AI Models', icon: HiOutlineVolumeUp },
    { id: 'billing', label: 'Billing', icon: HiOutlineCreditCard },
    { id: 'data-controls', label: 'Data controls', icon: HiOutlineDatabase },
    { id: 'storage', label: 'Storage', icon: HiOutlineServer },
    { id: 'safety', label: 'Safety', icon: HiOutlineShieldCheck },
    { id: 'security', label: 'Security and login', icon: HiOutlineKey },
    { id: 'parental', label: 'Parental controls', icon: HiOutlineUserGroup },
    { id: 'trusted', label: 'Trusted contact', icon: HiOutlineHand },
    { id: 'account', label: 'Account', icon: HiOutlineUser },
    { id: 'keyboard', label: 'Keyboard', icon: HiOutlineTerminal },
  ];

  return (
    <div className="settings-page-wrapper">
      <div className="settings-modal-card">
        {/* Left Sidebar Tabs */}
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <button className="settings-close-icon" aria-label="Close settings">
              <HiOutlineX />
            </button>
          </div>
          <nav className="settings-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`settings-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="settings-nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Panel */}
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">General</h2>

              {/* Security Banner Card */}
              {!mfaSetup ? (
                <div className="settings-banner-card">
                  <button className="banner-close-btn" onClick={() => setMfaSetup(true)}>
                    <HiOutlineX />
                  </button>
                  <div className="banner-icon-wrapper">
                    <HiOutlineLockClosed />
                  </div>
                  <div className="banner-content">
                    <h4>Secure your account</h4>
                    <p>Add multi-factor authentication (MFA), like a text message or authenticator app, to help protect your account when logging in.</p>
                    <button className="banner-action-btn" onClick={() => setMfaSetup(true)}>Set up MFA</button>
                  </div>
                </div>
              ) : (
                <div className="settings-banner-card success">
                  <div className="banner-icon-wrapper success">
                    <HiOutlineCheck />
                  </div>
                  <div className="banner-content">
                    <h4>Account Protection Active</h4>
                    <p>Your workspace is protected with session tokens and local encryption.</p>
                  </div>
                </div>
              )}

              {/* Rows */}
              <div className="settings-field-row">
                <div className="field-label">Appearance</div>
                <div className="field-control">
                  <select value={appearance} onChange={(e) => setAppearance(e.target.value)}>
                    <option value="System">System ⌄</option>
                    <option value="Dark">Dark</option>
                    <option value="Light">Light</option>
                  </select>
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Contrast</div>
                <div className="field-control">
                  <select value={contrast} onChange={(e) => setContrast(e.target.value)}>
                    <option value="System">System ⌄</option>
                    <option value="High">High Contrast</option>
                  </select>
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Accent color</div>
                <div className="field-control">
                  <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)}>
                    <option value="Default">● Default ⌄</option>
                    <option value="Indigo">● Indigo</option>
                    <option value="Purple">● Purple</option>
                    <option value="Emerald">● Emerald</option>
                  </select>
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Language</div>
                <div className="field-control">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="Auto-detect">Auto-detect ⌄</option>
                    <option value="English (US)">English (US)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                  </select>
                </div>
              </div>

              <div className="settings-field-row vertical">
                <div className="field-label-wrapper">
                  <div className="field-label">Higher intelligence</div>
                  <div className="field-sublabel">
                    AaisuuSync can automatically use higher intelligence model (Gemini 3.5 Pro) when processing complex reel automation.
                  </div>
                </div>
                <div className="field-control">
                  <div 
                    className={`custom-switch ${higherIntelligence ? 'on' : ''}`} 
                    onClick={() => setHigherIntelligence(!higherIntelligence)} 
                  />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Enable Dictation</div>
                <div className="field-control">
                  <div 
                    className={`custom-switch ${enableDictation ? 'on' : ''}`} 
                    onClick={() => setEnableDictation(!enableDictation)} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">Plugins & API Keys</h2>
              <p className="settings-panel-sub">Configure your API credentials to power AI reel synthesis and stock downloads.</p>

              <div className="settings-field-row vertical">
                <div className="field-label-wrapper">
                  <div className="field-label">Google Gemini Pro API Key</div>
                  <div className="field-sublabel">Used for multimodal script generation, LRC transcription, and automated prompts.</div>
                </div>
                <div className="field-control-full">
                  <div className="input-with-button">
                    <input
                      type={revealGemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                    />
                    <button type="button" onClick={() => setRevealGemini(!revealGemini)}>
                      {revealGemini ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-field-row vertical">
                <div className="field-label-wrapper">
                  <div className="field-label">Pexels Stock API Token</div>
                  <div className="field-sublabel">Used for fetching high-resolution 9:16 background video clips and photography.</div>
                </div>
                <div className="field-control-full">
                  <div className="input-with-button">
                    <input
                      type={revealPexels ? 'text' : 'password'}
                      value={pexelsKey}
                      onChange={(e) => setPexelsKey(e.target.value)}
                      placeholder="Pexels auth token..."
                    />
                    <button type="button" onClick={() => setRevealPexels(!revealPexels)}>
                      {revealPexels ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-action-row">
                <button className="primary-btn" onClick={handleSaveApi}>Save API Keys</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">Notifications</h2>
              
              <div className="settings-field-row">
                <div className="field-label-wrapper">
                  <div className="field-label">DM Auto-Reply Alert</div>
                  <div className="field-sublabel">Notify when AI auto-responds to an Instagram direct message.</div>
                </div>
                <div className="field-control">
                  <div className={`custom-switch ${notifyDM ? 'on' : ''}`} onClick={() => setNotifyDM(!notifyDM)} />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label-wrapper">
                  <div className="field-label">Reel Publication Success</div>
                  <div className="field-sublabel">Receive a alert when a generated reel finishes uploading.</div>
                </div>
                <div className="field-control">
                  <div className={`custom-switch ${notifyReel ? 'on' : ''}`} onClick={() => setNotifyReel(!notifyReel)} />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label-wrapper">
                  <div className="field-label">System Warning Alerts</div>
                  <div className="field-sublabel">High priority alerts for API rate limits and Chrome profile sessions.</div>
                </div>
                <div className="field-control">
                  <div className={`custom-switch ${notifySystem ? 'on' : ''}`} onClick={() => setNotifySystem(!notifySystem)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">Voice & AI Models</h2>

              <div className="settings-field-row">
                <div className="field-label">Active AI Model</div>
                <div className="field-control">
                  <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)}>
                    <option value="gemini">Gemini Pro (Cloud)</option>
                    <option value="ollama">Ollama (Local)</option>
                    <option value="gpt4">GPT-4 (OpenAI)</option>
                    <option value="claude">Claude 3.5 (Cloud)</option>
                    <option value="llama">Llama 3 (Local)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">Billing</h2>
              <div className="billing-card">
                <div className="billing-card-header">
                  <div>
                    <h4>AaisuuSync Free</h4>
                    <p>Standard Tier • Unlimited Local Reels & Multi-Account Automation</p>
                  </div>
                  <span className="billing-badge">ACTIVE PLAN</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">Account</h2>

              <div className="settings-field-row">
                <div className="field-label">Full Name</div>
                <div className="field-control">
                  <input type="text" defaultValue={user.name || 'Abhay Gupta'} readOnly />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Email Address</div>
                <div className="field-control">
                  <input type="email" defaultValue={user.email || 'abhaygupta26nov11@gmail.com'} readOnly />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="field-label">Subscription Tier</div>
                <div className="field-control">
                  <span className="badge-free">AaisuuSync Free</span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {['personalization', 'data-controls', 'storage', 'safety', 'security', 'parental', 'trusted', 'keyboard'].includes(activeTab) && (
            <div className="settings-panel-section fade-in">
              <h2 className="settings-panel-title">{navItems.find(i => i.id === activeTab)?.label}</h2>
              <p className="settings-panel-sub">Preferences for this section are managed automatically by AaisuuSync platform daemon.</p>
              
              <div className="settings-banner-card success" style={{ marginTop: 20 }}>
                <div className="banner-icon-wrapper success">
                  <HiOutlineCheck />
                </div>
                <div className="banner-content">
                  <h4>Standard Controls Active</h4>
                  <p>All policies and security constraints are operating normally for user <strong>{user.name}</strong>.</p>
                </div>
              </div>
            </div>
          )}

          {showSavedNotification && (
            <div className="toast-success">
              ✓ Settings saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
