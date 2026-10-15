import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ErrorBanner } from '../../components/common/ErrorMessage.js';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signup({ name, email, password, timezone });
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>
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
          Create an account
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Start building your personal library and activity timeline
        </p>
      </div>

      <div className="card">
        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

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

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password (min. 6 characters)</label>
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

          <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Detected timezone: <strong style={{ color: 'var(--text-secondary)' }}>{timezone}</strong>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
