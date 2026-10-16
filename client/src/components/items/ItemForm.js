import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { categoriesApi } from '../../services/api.js';
import { TrackingIcon } from '../common/TrackingIcon.js';
import { ErrorBanner, WarningBanner } from '../common/ErrorMessage.js';
import { Spinner } from '../common/Loader.js';

export const AVAILABLE_ICONS = [
  'activity', 'utensils', 'footprints', 'bike', 'phone', 'coffee',
  'dumbbell', 'book', 'shopping', 'car', 'heart', 'plane', 'film', 'music',
  'receivable', 'wallet', 'money', 'sparkles', 'others'
];

export const PRESET_COLORS = [
  '#3ecf8e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#64748b'
];

export function ItemForm({
  initialValues = {},
  isEditing = false,
  onSubmit,
  onCancel,
  submitLabel,
  isModal = false,
}) {
  const [name, setName] = useState(initialValues.name || '');
  const [categoryId, setCategoryId] = useState(
    initialValues.categoryId || initialValues.category_id || ''
  );
  const [description, setDescription] = useState(initialValues.description || '');
  const [trackingType, setTrackingType] = useState(
    initialValues.trackingType || initialValues.tracking_type || 'general'
  );
  const [targetAmount, setTargetAmount] = useState(
    initialValues.targetAmount !== undefined && initialValues.targetAmount !== null
      ? String(initialValues.targetAmount)
      : initialValues.target_amount !== undefined && initialValues.target_amount !== null
        ? String(initialValues.target_amount)
        : ''
  );
  const [currency, setCurrency] = useState(initialValues.currency || '₹');
  const [icon, setIcon] = useState(initialValues.icon || 'activity');
  const [color, setColor] = useState(initialValues.color || '#3ecf8e');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.name !== undefined) setName(initialValues.name || '');
      if (initialValues.categoryId !== undefined || initialValues.category_id !== undefined) {
        setCategoryId(initialValues.categoryId || initialValues.category_id || '');
      }
      if (initialValues.description !== undefined) setDescription(initialValues.description || '');
      if (initialValues.trackingType !== undefined || initialValues.tracking_type !== undefined) {
        setTrackingType(initialValues.trackingType || initialValues.tracking_type || 'general');
      }
      if (initialValues.targetAmount !== undefined || initialValues.target_amount !== undefined) {
        const amt = initialValues.targetAmount ?? initialValues.target_amount;
        setTargetAmount(amt !== null && amt !== undefined ? String(amt) : '');
      }
      if (initialValues.currency !== undefined) setCurrency(initialValues.currency || '₹');
      if (initialValues.icon !== undefined) setIcon(initialValues.icon || 'activity');
      if (initialValues.color !== undefined) setColor(initialValues.color || '#3ecf8e');
    }
  }, [initialValues]);

  useEffect(() => {
    let mounted = true;
    categoriesApi
      .getAll()
      .then((res) => {
        if (mounted) setCategories(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    if (trackingType === 'receivable' && (!targetAmount || parseFloat(targetAmount) <= 0)) {
      setError('Please specify a valid total target amount to receive');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDuplicateWarning(null);

      const payload = {
        name: name.trim(),
        categoryId: categoryId || null,
        description: description ? description.trim() : '',
        trackingType,
        icon,
        color,
        targetAmount: trackingType === 'receivable' ? (parseFloat(targetAmount) || null) : null,
        currency: '₹',
      };

      const res = await onSubmit(payload);
      if (res?.duplicateWarning) {
        setDuplicateWarning(
          isEditing
            ? 'Notice: Another item with this name already exists.'
            : 'Notice: An item with this name already exists in your library.'
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={isModal ? '' : 'card'}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {error && <ErrorBanner message={error} />}
      {duplicateWarning && <WarningBanner message={duplicateWarning} />}

      {/* Item Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="item-name-input">
          Item Name *
        </label>
        <input
          id="item-name-input"
          type="text"
          className="form-input"
          placeholder="e.g. Money from John, Walk, Call, Biryani..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
          This is the top-level reusable template. Sub-varieties (e.g. Push Day for Gym, Cappuccino for Coffee, or Dark Chocolate) can be added as variants later.
        </span>
      </div>

      {/* Tracking Type */}
      <div className="form-group">
        <label className="form-label" htmlFor="item-type-select">
          Tracking Type *
        </label>
        <select
          id="item-type-select"
          className="form-select"
          value={trackingType}
          onChange={(e) => {
            const val = e.target.value;
            setTrackingType(val);
            if (val === 'receivable' && icon === 'activity') {
              setIcon('receivable');
            }
          }}
          disabled={isEditing}
        >
          <option value="general">General Event, Food & Drink</option>
          <option value="receivable">Money Receivable</option>
          <option value="timed">Timed Activity</option>
          <option value="trip">Trip / Ride</option>
          <option value="call">Call / Communication</option>
        </select>
      </div>

      {/* Target Amount for Receivable */}
      {trackingType === 'receivable' && (
        <div
          className="form-group"
          style={{
            padding: 'var(--space-3)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-green-glow)',
          }}
        >
          <label className="form-label" htmlFor="item-target-amount">
            Total Target Amount ({currency}) *
          </label>
          <input
            id="item-target-amount"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            placeholder="e.g. 20000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required={trackingType === 'receivable'}
          />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Total amount to be received from the person. Each logged activity will record a partial payment received (e.g. 2000 + 3000 + ...).
          </span>
        </div>
      )}

      {/* Category */}
      <div className="form-group">
        <label className="form-label" htmlFor="item-category-select">
          Category (Optional)
        </label>
        <select
          id="item-category-select"
          className="form-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">No Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="item-desc-input">
          Description (Optional)
        </label>
        <textarea
          id="item-desc-input"
          className="form-textarea"
          rows={3}
          placeholder="Add context or notes about this activity..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Icon Picker */}
      <div className="form-group">
        <label className="form-label">Icon</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {AVAILABLE_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                padding: 'var(--space-2)',
                borderColor: icon === ic ? 'var(--accent-green)' : 'var(--border-subtle)',
                backgroundColor: icon === ic ? 'var(--accent-green-glow)' : 'var(--bg-input)',
                color: icon === ic ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}
              onClick={() => setIcon(ic)}
              title={ic === 'others' ? 'Others / Miscellaneous' : ic}
            >
              <TrackingIcon name={ic} size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div className="form-group">
        <label className="form-label">Accent Color</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: c,
                border: color === c ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onClick={() => setColor(c)}
              title={c}
            >
              {color === c && <Check size={14} color="#000" />}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-2)',
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {loading && <Spinner size={14} color="currentColor" />}
          <span>{loading ? 'Saving...' : submitLabel || (isEditing ? 'Save Changes' : 'Create Item')}</span>
        </button>
      </div>
    </form>
  );
}
