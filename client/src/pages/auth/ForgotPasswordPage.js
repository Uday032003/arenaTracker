import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send } from 'lucide-react';
import { authApi } from '../../services/api.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      const res = await authApi.forgotPassword(email);
      setSuccess('If an account matches this email, a reset token has been generated.');
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to process request');
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
          Reset Password
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="card">
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}

        {resetToken && (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'rgba(62, 207, 142, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-green)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <p style={{ fontWeight: 600, color: 'var(--accent-green-light)', marginBottom: 'var(--space-1)' }}>
              Developer / Demo Reset Link:
            </p>
            <Link
              to={`/reset-password?token=${resetToken}`}
              style={{ color: 'var(--accent-green)', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              Click here to set your new password
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Generate Reset Link'}
            {!loading && <Send size={16} />}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
        <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </p>
    </div>
  );
}
