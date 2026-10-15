import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="banner banner-error" role="alert">
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry} style={{ color: 'inherit' }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function WarningBanner({ message }) {
  if (!message) return null;
  return (
    <div className="banner banner-warning" role="alert">
      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="banner banner-success" role="status">
      <CheckCircle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}
