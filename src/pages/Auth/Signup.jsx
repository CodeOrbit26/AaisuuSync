import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineExclamationCircle, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowRight } from 'react-icons/hi';
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

    // Small delay for UX feel
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
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-logo">A</div>
          <h1>Create Account</h1>
          <p>Start automating with AaisuuSync</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authError && (
            <div className="auth-error">
              <HiOutlineExclamationCircle className="auth-error-icon" />
              {authError}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Abhay Gupta"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError(); }}
              autoComplete="name"
              autoFocus
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="auth-password-wrapper">
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
            <input
              id="signup-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
              autoComplete="new-password"
              required
            />
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
                Create Account <HiOutlineArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
