import React, { useState, useEffect } from 'react';
import { Square, Clock, Navigation } from 'lucide-react';
import { TrackingIcon } from '../common/TrackingIcon.js';
import { Spinner } from '../common/Loader.js';

export function ActiveTimerCard({ session, onStop, onAddPlace, isStopping = false }) {
  const [elapsed, setElapsed] = useState(() => {
    const started = new Date(session.started_at).getTime();
    return Math.max(0, Math.floor((Date.now() - started) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const started = new Date(session.started_at).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [session.started_at]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTrip = session.tracking_type === 'trip';

  return (
    <div
      className="card"
      style={{
        border: '1px solid var(--border-accent)',
        backgroundColor: 'rgba(62, 207, 142, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(62, 207, 142, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <TrackingIcon name={session.item_icon} size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              {session.item_name}
            </h4>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
              {isTrip ? 'Ride in progress' : 'Active timer session'}
            </span>
          </div>
        </div>

        {/* Live Elapsed Time Display */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <Clock size={16} />
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      {session.notes && (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{session.notes}"
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
        {isTrip && onAddPlace && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onAddPlace(session.id)}
          >
            <Navigation size={14} />
            <span>Add Place</span>
          </button>
        )}

        <button
          className="btn btn-danger btn-sm"
          onClick={() => onStop(session.id)}
          disabled={isStopping}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {isStopping ? (
            <>
              <Spinner size={13} color="currentColor" />
              <span>Stopping...</span>
            </>
          ) : (
            <>
              <Square size={14} />
              <span>Stop {isTrip ? 'Ride' : 'Session'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
