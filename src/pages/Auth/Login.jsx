import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowRight } from 'react-icons/hi';
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

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 400));

    const success = login(email, password);
    if (success) {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">A</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your AaisuuSync account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authError && (
            <div className="auth-error">
              <HiOutlineExclamationCircle className="auth-error-icon" />
              {authError}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-wrapper">
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
                Sign In <HiOutlineArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
