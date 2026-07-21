import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineExclamationCircle, 
  HiOutlineEye, 
  HiOutlineEyeOff, 
  HiOutlineArrowRight,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineFilm,
  HiOutlineShare,
  HiOutlineLightningBolt,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const { signup, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const success = signup(name, email, password);
    if (success) {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  const clearError = () => setAuthError('');

  return (
    <div className="auth-page">
      <div className="auth-background-glow glow-1"></div>
      <div className="auth-background-glow glow-2"></div>
      <div className="auth-background-grid"></div>

      <div className="auth-container">
        {/* Left Side: Hero Info */}
        <div className="auth-hero">
          <div className="auth-hero-brand">
            <div className="auth-hero-logo">
              <HiOutlineSparkles />
            </div>
            <div>
              <span className="auth-hero-title">AaisuuSync</span>
              <span className="auth-hero-badge">AI PLATFORM</span>
            </div>
          </div>

          <h1 className="auth-hero-headline">
            Build Your Own <br />
            <span className="gradient-text">AI Content Empire</span>
          </h1>

          <p className="auth-hero-subtext">
            Join content creators and automation engineers orchestrating end-to-end video synthesis, account workflows, and multi-platform publishing.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-reel">
                <HiOutlineFilm />
              </div>
              <div>
                <h4>Autonomous Reel Creation</h4>
                <p>Generate, edit, overlay LRC lyrics and render full HD MP4s</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-share">
                <HiOutlineShare />
              </div>
              <div>
                <h4>Zero-Latency Dispatch</h4>
                <p>Automate posts across Instagram, YouTube, and LinkedIn</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon icon-lightning">
                <HiOutlineLightningBolt />
              </div>
              <div>
                <h4>Private Workspace Data</h4>
                <p>Your API keys and profiles stay strictly isolated to your user ID</p>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer">
            <div className="auth-trust-badge">
              <HiOutlineCheckCircle className="trust-icon" />
              <span>Full Private Data Encryption</span>
            </div>
            <div className="auth-trust-badge">
              <HiOutlineCheckCircle className="trust-icon" />
              <span>Free Forever Workspace Tier</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-brand-mobile">
              <div className="auth-brand-logo">A</div>
              <h2>AaisuuSync</h2>
            </div>

            <div className="auth-card-header">
              <h2>Create your workspace</h2>
              <p>Get started with your free AaisuuSync AI account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {authError && (
                <div className="auth-error">
                  <HiOutlineExclamationCircle className="auth-error-icon" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="signup-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <HiOutlineUser className="input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Abhay Gupta"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError(); }}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <HiOutlineMail className="input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <div className="auth-input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 4 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    autoComplete="new-password"
                    required
                    minLength={4}
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

              <div className="auth-field">
                <label htmlFor="signup-confirm">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <HiOutlineLockClosed className="input-icon" />
                  <input
                    id="signup-confirm"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !name || !email || !password || !confirmPassword}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <HiOutlineArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
