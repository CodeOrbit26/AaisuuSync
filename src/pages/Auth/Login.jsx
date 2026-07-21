import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineExclamationCircle, 
  HiOutlineEye, 
  HiOutlineEyeOff, 
  HiOutlineArrowRight,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineFilm,
  HiOutlineShare,
  HiOutlineLightningBolt,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(r => setTimeout(r, 400));

    const success = login(email, password);
    if (success) {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-background-glow glow-1"></div>
      <div className="auth-background-glow glow-2"></div>
      <div className="auth-background-grid"></div>

      <div className="auth-container">
        {/* Left Side: Brand & Feature Showcase */}
        <div className="auth-hero">
          <div className="auth-hero-brand">
            <div className="auth-hero-logo" style={{ background: 'transparent' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <span className="auth-hero-title">AaisuuSync</span>
              <span className="auth-hero-badge">AI PLATFORM</span>
            </div>
          </div>

          <h1 className="auth-hero-headline">
            Autonomous Content <br />
            <span className="gradient-text">Automation Suite</span>
          </h1>

          <p className="auth-hero-subtext">
            Synthesize aesthetic reels, schedule LinkedIn posts, auto-publish YouTube Shorts, and automate Instagram DMs in one unified workspace.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-reel">
                <HiOutlineFilm />
              </div>
              <div>
                <h4>Reel Synthesis Engine</h4>
                <p>AI LRC lyric syncing, typography animation & visual templates</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-share">
                <HiOutlineShare />
              </div>
              <div>
                <h4>Multi-Network Scheduler</h4>
                <p>Post synchronously across Instagram, YouTube & LinkedIn</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-lightning">
                <HiOutlineLightningBolt />
              </div>
              <div>
                <h4>Gemini 3.5 Powered</h4>
                <p>Ultra-fast multimodal prompt processing and automated hooks</p>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="auth-trust-badge">
              <HiOutlineCheckCircle className="trust-icon" />
              <span>Isolated Per-User Workspaces</span>
            </div>
            <div className="auth-trust-badge">
              <HiOutlineCheckCircle className="trust-icon" />
              <span>Local Chrome Session Management</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-brand-mobile">
              <img src="/logo.png" alt="Logo" className="auth-brand-logo" style={{ background: 'transparent', objectFit: 'contain' }} />
              <h2>AaisuuSync</h2>
            </div>

            <div className="auth-card-header">
              <h2>Welcome back</h2>
              <p>Sign in to manage your automated content agents</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>

              {authError && (
                <div className="auth-error">
                  <HiOutlineExclamationCircle className="auth-error-icon" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="login-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <HiOutlineMail className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-field-header">
                  <label htmlFor="login-password">Password</label>
                </div>
                <div className="auth-input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <HiOutlineArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              New to AaisuuSync?{' '}
              <Link to="/signup" className="auth-link">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
