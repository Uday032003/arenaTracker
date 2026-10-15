import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Logo } from '../common/Logo.js';

export function Header({ title }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      {/* Visible on mobile only */}
      <div className="header-mobile-brand">
        <Logo size="md" />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/reminders')}
          aria-label="Reminders & Alarms"
          title="Reminders & Alarms"
          style={{ padding: '0.4rem', color: 'var(--accent-green)' }}
        >
          <Bell size={18} />
        </button>

        <button
          className="btn btn-primary btn-sm header-quick-log"
          onClick={() => navigate('/activities/new')}
        >
          <Plus size={14} />
          <span>Quick Log</span>
        </button>

        {loading ? (
          <div
            className="skeleton"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
            }}
          />
        ) : (
          <button
            onClick={() => navigate('/settings')}
            aria-label="Account Settings"
            title={user?.name ? `${user.name} - Settings` : 'Account Settings'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-card)',
              border: '1.5px solid var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'var(--accent-green)',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              boxShadow: '0 0 8px var(--accent-green-glow)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </button>
        )}
      </div>
    </header>
  );
}
