import React from 'react';
import { TrackingIcon } from './TrackingIcon.js';

export function EmptyState({
  icon = 'sparkles',
  title = 'No records found',
  description = 'Start tracking to see your personal history here.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <TrackingIcon name={icon} size={24} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
