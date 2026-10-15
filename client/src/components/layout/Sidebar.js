import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Layers,
  History,
  BarChart3,
  Settings,
  PlusCircle,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Logo } from '../common/Logo.js';

export function Sidebar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/items', label: 'Items Library', icon: Layers },
    { to: '/reminders', label: 'Reminders & Alarms', icon: Bell },
    { to: '/history', label: 'History', icon: History },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="desktop-sidebar">
      {/* Brand */}
      <div style={{ padding: 'var(--space-2)' }}>
        <Logo size="lg" />
      </div>

      {/* Quick Log Shortcut */}
      <div style={{ marginTop: 'var(--space-6)', padding: '0 var(--space-2)' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/activities/new')}
        >
          <PlusCircle size={16} />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div
          onClick={() => navigate('/settings')}
          title="Account Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
        >
          {loading ? (
            <>
              <div
                className="skeleton"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: '85px', height: '14px' }} />
                <div className="skeleton" style={{ width: '120px', height: '10px' }} />
              </div>
            </>
          ) : (
            <>
              <div
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
                  flexShrink: 0,
                  boxShadow: '0 0 8px var(--accent-green-glow)',
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name || 'User'}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.email}
                </p>
              </div>
            </>
          )}
        </div>

        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
