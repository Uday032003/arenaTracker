import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Logo } from '../common/Logo.js';
import { Spinner } from '../common/Loader.js';

export function Header({ title }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

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

        {/* User Avatar with Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
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
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="Account Menu"
              aria-expanded={dropdownOpen}
              title={user?.name ? `${user.name} - Account Menu` : 'Account Menu'}
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

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--space-2)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'scaleUp 0.15s ease-out',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '4px',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </p>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)' }}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </button>

              <button
                className="btn btn-ghost btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  color: 'var(--danger)',
                }}
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                disabled={loggingOut}
              >
                {loggingOut ? <Spinner size={15} color="var(--danger)" /> : <LogOut size={16} />}
                <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
