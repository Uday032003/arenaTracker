import React from 'react';
import { Bell, Clock, CheckCircle, Volume2 } from 'lucide-react';
import { useAlarm } from '../../context/AlarmContext.js';

export function ActiveAlarmModal() {
  const { activeAlarms, dismissAlarm, snoozeAlarm, completeAlarm } = useAlarm();

  if (!activeAlarms || activeAlarms.length === 0) return null;

  const current = activeAlarms[0];

  const getTypeLabel = (type) => {
    switch (type) {
      case 'emi':
        return { label: 'EMI Payment', badge: 'rgba(62, 207, 142, 0.15)', text: 'var(--accent-green)' };
      case 'birthday':
        return { label: 'Birthday', badge: 'rgba(236, 72, 153, 0.15)', text: '#ec4899' };
      case 'bill':
        return { label: 'Utility Bill', badge: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
      case 'anniversary':
        return { label: 'Anniversary', badge: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' };
      case 'medicine':
        return { label: 'Medicine', badge: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9' };
      default:
        return { label: 'Reminder', badge: 'rgba(62, 207, 142, 0.15)', text: 'var(--accent-green)' };
    }
  };

  const typeInfo = getTypeLabel(current.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 10, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          border: '1.5px solid var(--border-accent)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px var(--accent-green-glow)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* App Theme Neon Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-green-glow)',
            border: '1px solid var(--border-accent)',
            color: 'var(--accent-green)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Volume2 size={16} />
          <span>Alarm Ringing • Sound Active</span>
        </div>

        {/* App Theme Pulsing Bell Orb */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Outer expanding ripple in accent green */}
            <div
              style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '1.5px solid var(--border-accent)',
                animation: 'themeRipple 1.8s infinite ease-out',
              }}
            />
            {/* Bell orb */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.25) 0%, rgba(62, 207, 142, 0.08) 100%)',
                border: '1.5px solid var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
                boxShadow: '0 0 25px rgba(62, 207, 142, 0.45), inset 0 0 15px rgba(62, 207, 142, 0.2)',
                animation: 'bellGentleTilt 0.8s infinite ease-in-out',
              }}
            >
              <Bell size={32} />
            </div>
          </div>
        </div>

        {/* Type Badge */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <span
            style={{
              backgroundColor: typeInfo.badge,
              color: typeInfo.text,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {typeInfo.label}
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            wordBreak: 'break-word',
          }}
        >
          {current.title}
        </h2>

        {/* Amount for EMI / Bills in App Accent Green */}
        {current.amount && (
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--accent-green)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {current.currency || '₹'}
            {Number(current.amount).toLocaleString()}
          </div>
        )}

        {/* Advance Notice Banner */}
        {current.remind_before_days > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: 'var(--space-3)',
            }}
          >
            ⏰ Advance Notice: Due in {current.remind_before_days} day{current.remind_before_days > 1 ? 's' : ''} on{' '}
            {new Date(current.due_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}

        {/* Notes */}
        {current.notes && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-5)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {current.notes}
          </p>
        )}

        {/* Queue indicator if multiple alarms */}
        {activeAlarms.length > 1 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            + {activeAlarms.length - 1} more alarm{activeAlarms.length > 2 ? 's' : ''} queued
          </div>
        )}

        {/* Action Buttons styled in App Theme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              backgroundColor: 'var(--accent-green)',
              color: 'var(--text-inverse)',
              border: 'none',
              padding: '13px',
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              boxShadow: 'var(--shadow-green)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            onClick={() => dismissAlarm(current.id)}
          >
            Stop Alarm
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => snoozeAlarm(current.id, 10)}
            >
              <Clock size={16} />
              <span>Snooze (10m)</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{
                justifyContent: 'center',
                borderColor: 'var(--border-accent)',
                color: 'var(--accent-green)',
                backgroundColor: 'var(--accent-green-glow)',
              }}
              onClick={() => completeAlarm(current.id)}
            >
              <CheckCircle size={16} />
              <span>Completed</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bellGentleTilt {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(8deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes themeRipple {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
