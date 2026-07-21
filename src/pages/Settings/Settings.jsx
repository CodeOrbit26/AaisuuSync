import React, { useState } from 'react';
import {
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineBell,
  HiOutlineCog,
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import './Settings.css';

export default function Settings() {
  const { user, apiKeys, saveApiKeys, activeModel, setActiveModel } = useApp();
  const [notifyDM, setNotifyDM] = useState(true);
  const [notifyReel, setNotifyReel] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [pexelsKey, setPexelsKey] = useState(apiKeys.pexels || '');
  const [revealGemini, setRevealGemini] = useState(false);
  const [revealPexels, setRevealPexels] = useState(false);

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
  };

  return (
    <div className="settings-page page-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure your AaisuuSync platform preferences and integrations.</p>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="glass-card settings-section-card">
          <div className="settings-section-title">
            <HiOutlineUser style={{ color: 'var(--accent-primary)' }} />
            Profile Settings
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Display Name</label>
              <span>Your public display name</span>
            </div>
            <div className="settings-row-right">
              <input type="text" defaultValue={user.name} />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Email Address</label>
              <span>Used for notifications and login</span>
            </div>
            <div className="settings-row-right">
              <input type="email" defaultValue={user.email} />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Timezone</label>
              <span>For scheduling automation tasks</span>
            </div>
            <div className="settings-row-right">
              <select>
                <option>Asia/Kolkata (IST)</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
                <option>America/Los_Angeles (PST)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="settings-section">
        <div className="glass-card settings-section-card">
          <div className="settings-section-title">
            <HiOutlineKey style={{ color: 'var(--warning)' }} />
            API Configuration
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Gemini API Key</label>
              <span>Used for AI content generation</span>
            </div>
            <div className="settings-row-right">
              <div className="settings-api-key">
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
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Pexels API Key</label>
              <span>For stock images and videos in reels</span>
            </div>
            <div className="settings-row-right">
              <div className="settings-api-key">
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
          <div className="settings-row">
            <div className="settings-row-left">
              <label>AI Model</label>
              <span>Select the AI model for inference</span>
            </div>
            <div className="settings-row-right">
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
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <div className="glass-card settings-section-card">
          <div className="settings-section-title">
            <HiOutlineBell style={{ color: 'var(--success)' }} />
            Notifications
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>DM Notifications</label>
              <span>Get notified when AI replies to a DM</span>
            </div>
            <div className="settings-row-right">
              <div className={`settings-toggle ${notifyDM ? 'on' : ''}`} onClick={() => setNotifyDM(!notifyDM)} role="switch" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Reel Published</label>
              <span>Notify when a reel is published automatically</span>
            </div>
            <div className="settings-row-right">
              <div className={`settings-toggle ${notifyReel ? 'on' : ''}`} onClick={() => setNotifyReel(!notifyReel)} role="switch" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>System Alerts</label>
              <span>Critical system errors and warnings</span>
            </div>
            <div className="settings-row-right">
              <div className={`settings-toggle ${notifySystem ? 'on' : ''}`} onClick={() => setNotifySystem(!notifySystem)} role="switch" />
            </div>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="settings-section">
        <div className="glass-card settings-section-card">
          <div className="settings-section-title">
            <HiOutlineCog style={{ color: 'var(--text-secondary)' }} />
            System
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Auto Backup</label>
              <span>Automatically backup blueprints and configs</span>
            </div>
            <div className="settings-row-right">
              <div className={`settings-toggle ${autoBackup ? 'on' : ''}`} onClick={() => setAutoBackup(!autoBackup)} role="switch" />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Polling Interval</label>
              <span>How often the daemon checks for new tasks</span>
            </div>
            <div className="settings-row-right">
              <select>
                <option>Every 1 Hour</option>
                <option>Every 30 Minutes</option>
                <option>Every 15 Minutes</option>
                <option>Every 5 Minutes</option>
              </select>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-left">
              <label>Data Export</label>
              <span>Export all your data and configurations</span>
            </div>
            <div className="settings-row-right">
              <button className="gradient-btn" style={{ width: '100%', justifyContent: 'center' }}>Export Data</button>
            </div>
          </div>
        </div>
      </div>

      {showSavedNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-sm)',
          fontWeight: '600',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          ✓ Settings saved successfully!
        </div>
      )}

      <div className="settings-save-bar">
        <button 
          className="gradient-btn" 
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={handleReset}
        >
          Reset
        </button>
        <button className="gradient-btn" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
