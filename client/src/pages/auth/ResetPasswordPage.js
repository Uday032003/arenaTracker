import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { authApi } from '../../services/api.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Please request a new reset link.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--accent-green-glow)',
            border: '1px solid var(--accent-green)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-green)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <Sparkles size={24} />
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          Set New Password
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Enter and confirm your new account password
        </p>
      </div>

      <div className="card">
        {error && <ErrorBanner message={error} />}
        {success && (
          <SuccessBanner message="Password changed successfully! Redirecting to login..." />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || success}
          >
            {loading ? 'Updating...' : 'Set New Password'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
        <Link to="/login" style={{ color: 'var(--text-secondary)' }}>
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
