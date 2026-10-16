import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Globe,
  Palette,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { settingsApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { SkeletonSettings, Spinner } from '../../components/common/Loader.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { Modal } from '../../components/common/Modal.js';

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Australia/Sydney',
];

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [theme, setTheme] = useState('dark');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Account deletion modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await settingsApi.getSettings();
        if (res.data) {
          setName(res.data.user?.name || '');
          setTimezone(res.data.settings?.timezone || res.data.user?.timezone || 'UTC');
          setTheme(res.data.settings?.theme || 'dark');
        }
      } catch (err) {
        setError(err.message || 'Failed to load user settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await settingsApi.update({
        name: name.trim(),
        timezone,
        theme,
      });
      document.documentElement.setAttribute('data-theme', theme);
      await refreshUser();
      setSuccessMsg('Settings updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await fetch(settingsApi.exportUrl, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-tracker-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to log out');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await settingsApi.deleteAccount({ password: deletePassword });
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please verify password.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonSettings />;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Account & Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Manage your personal profile, timezone, export data, and privacy
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {successMsg && <SuccessBanner message={successMsg} />}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <User size={18} color="var(--accent-green)" />
          <span>Profile Details</span>
        </h2>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Email Address (Read-only)</label>
          <input
            type="email"
            className="form-input"
            value={user?.email || ''}
            disabled
            style={{ opacity: 0.7 }}
          />
        </div>

        {/* Timezone Preference */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Globe size={14} /> Timezone (Critical for accurate calendar date & day counters)
          </label>
          <select
            className="form-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Picker */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Palette size={14} /> Visual Theme
          </label>
          <select
            className="form-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Default Dark (Supabase)</option>
            <option value="charcoal">Charcoal Deep</option>
            <option value="obsidian">Pure Obsidian (OLED Black)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {saving && <Spinner size={14} color="currentColor" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Export Account Data Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Download size={18} color="var(--accent-green)" />
          <span>Data Portability & Backup</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          Download a complete JSON export of all your items, variants, occurrences, timed sessions, and visited places. You own all your data.
        </p>
        <div>
          <button
            className="btn btn-secondary"
            onClick={handleExportData}
            disabled={exporting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {exporting ? (
              <>
                <Spinner size={14} color="currentColor" />
                <span>Exporting Data...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export All Data (.json)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Session & Logout */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <LogOut size={18} color="var(--accent-green)" />
          <span>Active Session</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          Currently logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>.
        </p>
        <div>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}
          >
            {loggingOut ? <Spinner size={14} color="var(--danger)" /> : <LogOut size={16} />}
            <span>{loggingOut ? 'Logging out...' : 'Log out of Account'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div
        className="card"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <AlertTriangle size={18} />
          <span>Danger Zone</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          Permanently delete your account and all associated items, history, and memory tracks. This action is irreversible.
        </p>
        <div>
          <button className="btn btn-danger" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 size={16} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        {deleteError && <ErrorBanner message={deleteError} />}

        <form onSubmit={handleDeleteAccount}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            Please enter your password to confirm permanent deletion of your account and all activity data.
          </p>

          <div className="form-group">
            <label className="form-label">Password Confirmation *</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={deleting || !deletePassword}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {deleting && <Spinner size={14} color="currentColor" />}
              <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
