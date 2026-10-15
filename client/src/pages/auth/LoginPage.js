import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ErrorBanner } from '../../components/common/ErrorMessage.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Sign in to your personal activity & memory tracker
        </p>
      </div>

      <div className="card">
        {error && <ErrorBanner message={error} />}

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
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
        Don't have an account yet?{' '}
        <Link to="/signup" style={{ color: 'var(--accent-green)', fontWeight: 500 }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
