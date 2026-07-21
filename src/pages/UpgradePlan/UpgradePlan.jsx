import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineChip,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineFilm,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './UpgradePlan.css';

export default function UpgradePlan() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  const handleSelectPlan = (planName) => {
    setUpgradedSuccess(planName);
    setTimeout(() => setUpgradedSuccess(false), 4000);
  };

  return (
    <div className="upgrade-container page-container">
      {/* Top Page Header Row */}
      <div className="page-header-row">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back" title="Go back">
          <HiOutlineArrowLeft />
        </button>
        <span className="page-header-context-title">Back to Dashboard</span>
      </div>

      {/* Hero Header */}
      <div className="upgrade-hero">
        <span className="upgrade-pill">
          <HiOutlineSparkles /> Pricing Tiers & Upgrades
        </span>
        <h2>Supercharge Your AI Automation Engine</h2>
        <p>Scale your Reels, YouTube Shorts, LinkedIn outreach, and Instagram DMs with high-speed AI pipelines.</p>

        {/* Billing Cycle Toggle */}
        <div className="billing-toggle-wrapper">
          <button
            className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
          <button
            className={`billing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual Billing <span className="discount-tag">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid">

        {/* Free Plan */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <span className="plan-badge free">Free Tier</span>
            <h3 className="plan-title">AaisuuSync Free</h3>
            <p className="plan-desc">For creators starting out with basic AI automation tools.</p>
            <div className="plan-price">
              <span className="price-amount">$0</span>
              <span className="price-period">/ forever</span>
            </div>
          </div>

          <div className="plan-features">
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>5 Automated Reel Drafts / month</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>1 Connected Social Account</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Google Gemini Pro (Cloud)</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Standard 15m Daemon Polling</span></div>
            <div className="feature-item disabled"><span>Instagram DM Auto-Responder (Pro)</span></div>
            <div className="feature-item disabled"><span>Custom LRC Lyrics Auto-Sync (Pro)</span></div>
          </div>

          <button className="plan-action-btn current" disabled>
            Current Active Plan
          </button>
        </div>

        {/* Pro Plan (Featured) */}
        <div className="pricing-card featured">
          <div className="popular-ribbon">Most Popular</div>
          <div className="pricing-card-header">
            <span className="plan-badge pro"><HiOutlineLightningBolt /> Recommended</span>
            <h3 className="plan-title">AaisuuSync Pro</h3>
            <p className="plan-desc">For serious growth creators & marketers running viral automation 24/7.</p>
            <div className="plan-price">
              <span className="price-amount">{billingCycle === 'annual' ? '$24' : '$29'}</span>
              <span className="price-period">/ month {billingCycle === 'annual' ? '(billed annually)' : ''}</span>
            </div>
          </div>

          <div className="plan-features">
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span><strong>Unlimited</strong> AI Reel Synthesis</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span><strong>Unlimited</strong> Connected Social Accounts</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span>Ultra-Fast 5m Worker Polling</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span>Instagram DM Auto-Responder AI</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span>LRC Lyrics Auto-Sync & Pexels 4K loops</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon highlight" /> <span>Local Ollama + GPT-4 Model Support</span></div>
          </div>

          <button 
            className="plan-action-btn pro-btn"
            onClick={() => handleSelectPlan('AaisuuSync Pro')}
          >
            Upgrade to Pro
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="pricing-card">
          <div className="pricing-card-header">
            <span className="plan-badge enterprise">Enterprise</span>
            <h3 className="plan-title">Agency & Scale</h3>
            <p className="plan-desc">Custom automation architecture for agencies managing multiple client brands.</p>
            <div className="plan-price">
              <span className="price-amount">{billingCycle === 'annual' ? '$79' : '$99'}</span>
              <span className="price-period">/ month</span>
            </div>
          </div>

          <div className="plan-features">
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Everything in Pro Plan</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Dedicated Chrome Worker Nodes</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Custom API Endpoint Integration</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Priority 24/7 SLA Engineering Support</span></div>
            <div className="feature-item"><HiOutlineCheck className="check-icon" /> <span>Multi-User Team Isolation</span></div>
          </div>

          <button 
            className="plan-action-btn enterprise-btn"
            onClick={() => handleSelectPlan('Agency & Enterprise')}
          >
            Contact Sales
          </button>
        </div>

      </div>

      {/* Feature Comparison Highlights */}
      <div className="comparison-banner">
        <div className="comparison-card">
          <HiOutlineFilm className="comp-icon" />
          <h4>AI Reel Engine</h4>
          <p>Automatic subtitle timing, Pexels video matching, and audio lyric synchronization.</p>
        </div>
        <div className="comparison-card">
          <HiOutlineUserGroup className="comp-icon" />
          <h4>LinkedIn Auto-Outreach</h4>
          <p>Smart messaging sequences and profile engagement powered by Gemini inference.</p>
        </div>
        <div className="comparison-card">
          <HiOutlineShieldCheck className="comp-icon" />
          <h4>Encrypted Isolation</h4>
          <p>Local Puppeteer profiles and isolated per-user local storage keys.</p>
        </div>
      </div>

      {/* Upgrade Toast */}
      {upgradedSuccess && (
        <div className="upgrade-toast">
          <HiOutlineCheckCircle className="toast-icon" />
          <span>Checkout simulation initiated for <strong>{upgradedSuccess}</strong>! Contact support for enterprise keys.</span>
        </div>
      )}
    </div>
  );
}
