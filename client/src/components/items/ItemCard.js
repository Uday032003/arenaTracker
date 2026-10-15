import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Pin, PinOff, Archive, RefreshCw, Trash2, Edit2, Play, Plus } from 'lucide-react';
import { TrackingIcon } from '../common/TrackingIcon.js';

export function ItemCard({
  item,
  onTogglePin,
  onArchive,
  onDelete,
  onStartTimer,
}) {
  const navigate = useNavigate();

  const getTrackingBadge = (type) => {
    switch (type) {
      case 'receivable':
        return <span className="badge badge-green">Receivable</span>;
      case 'timed':
        return <span className="badge badge-blue">Timed</span>;
      case 'trip':
        return <span className="badge badge-purple">Trip / Ride</span>;
      case 'call':
        return <span className="badge badge-green">Call</span>;
      case 'general':
      default:
        return <span className="badge badge-gray">General</span>;
    }
  };

  return (
    <div
      className="card card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        borderLeft: `4px solid ${item.color || 'var(--accent-green)'}`,
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color || 'var(--accent-green)',
                flexShrink: 0,
              }}
            >
              <TrackingIcon name={item.icon} size={20} />
            </div>

            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/items/${item.id}`)}
              >
                {item.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                {getTrackingBadge(item.tracking_type)}
                {item.category_name && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    • {item.category_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {onTogglePin && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px', color: item.is_pinned ? 'var(--accent-green)' : 'var(--text-muted)' }}
                onClick={() => onTogglePin(item)}
                title={item.is_pinned ? 'Unpin from Home' : 'Pin to Home'}
              >
                {item.is_pinned ? <Pin size={15} /> : <PinOff size={15} />}
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px' }}
              onClick={() => navigate(`/items/${item.id}/edit`)}
              title="Edit item"
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>

        {item.description && (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            {item.description}
          </p>
        )}

        {/* Occurrences & Last occurred stats */}
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {item.tracking_type === 'receivable' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress:</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                ₹{Number(item.total_collected || 0).toLocaleString()} / ₹{Number(item.target_amount || 0).toLocaleString()}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.tracking_type === 'receivable' ? 'Installments:' : 'Total logs:'}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.total_occurrences || 0}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{item.tracking_type === 'receivable' ? 'Last payment:' : 'Last occurred:'}</span>
            <span
              style={{
                fontWeight: 600,
                color:
                  item.last_occurrence?.status === 'today'
                    ? 'var(--accent-green)'
                    : item.last_occurrence?.status === 'yesterday'
                    ? 'var(--info)'
                    : 'var(--text-secondary)',
              }}
            >
              {item.last_occurrence?.label || 'Never logged'}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-2)',
        }}
      >
        {item.tracking_type === 'timed' || item.tracking_type === 'trip' ? (
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onStartTimer && onStartTimer(item.id)}
          >
            <Play size={14} />
            <span>Start</span>
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => navigate(`/activities/new?itemId=${item.id}`)}
          >
            <Plus size={14} />
            <span>{item.tracking_type === 'receivable' ? 'Installment' : 'Log'}</span>
          </button>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/items/${item.id}`)}
        >
          Details
        </button>

        {onArchive && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', color: 'var(--text-muted)' }}
            onClick={() => onArchive(item)}
            title={item.is_archived ? 'Restore' : 'Archive'}
          >
            {item.is_archived ? <RefreshCw size={14} /> : <Archive size={14} />}
          </button>
        )}

        {onDelete && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', color: 'var(--danger)' }}
            onClick={() => onDelete(item)}
            title="Delete item"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
