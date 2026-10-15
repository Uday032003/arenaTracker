import React from 'react';
import { Modal } from './Modal.js';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {isDanger && (
          <div
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
