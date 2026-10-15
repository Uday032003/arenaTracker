import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { itemsApi, categoriesApi } from '../../services/api.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';
import { ErrorBanner, WarningBanner } from '../../components/common/ErrorMessage.js';
import { SkeletonForm } from '../../components/common/Loader.js';

const AVAILABLE_ICONS = [
  'activity', 'utensils', 'footprints', 'bike', 'phone', 'coffee',
  'dumbbell', 'book', 'shopping', 'car', 'heart', 'plane', 'film', 'music',
  'receivable', 'wallet', 'money'
];

const PRESET_COLORS = [
  '#3ecf8e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#64748b'
];

export function ItemFormPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const isEditing = Boolean(itemId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState('general');
  const [targetAmount, setTargetAmount] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [icon, setIcon] = useState('activity');
  const [color, setColor] = useState('#3ecf8e');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await categoriesApi.getAll();
        setCategories(catRes.data || []);

        if (isEditing) {
          const itemRes = await itemsApi.getById(itemId);
          const itm = itemRes.data;
          setName(itm.name || '');
          setCategoryId(itm.category_id || '');
          setDescription(itm.description || '');
          setTrackingType(itm.tracking_type || 'general');
          setTargetAmount(itm.target_amount ? String(itm.target_amount) : '');
          setCurrency(itm.currency || '₹');
          setIcon(itm.icon || 'activity');
          setColor(itm.color || '#3ecf8e');
        }
      } catch (err) {
        setError(err.message || 'Failed to load item');
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [itemId, isEditing]);

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
        description: description.trim(),
        trackingType,
        icon,
        color,
        targetAmount: trackingType === 'receivable' ? (parseFloat(targetAmount) || null) : null,
        currency: '₹',
      };

      if (isEditing) {
        const res = await itemsApi.update(itemId, payload);
        if (res.duplicateWarning) {
          setDuplicateWarning('Notice: Another item with this name already exists.');
        }
        navigate(`/items/${itemId}`);
      } else {
        const res = await itemsApi.create(payload);
        if (res.duplicateWarning) {
          setDuplicateWarning('Notice: An item with this name already exists in your library.');
        }
        navigate(`/items/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <SkeletonForm title="Item" />;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(isEditing ? `/items/${itemId}` : '/items')}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
          {isEditing ? `Edit Item: ${name}` : 'Create New Reusable Item'}
        </h1>
      </div>

      {error && <ErrorBanner message={error} />}
      {duplicateWarning && <WarningBanner message={duplicateWarning} />}

      <form onSubmit={handleSubmit} className="card">
        {/* Item Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="name">Item Name *</label>
          <input
            id="name"
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
          <label className="form-label" htmlFor="trackingType">Tracking Type *</label>
          <select
            id="trackingType"
            className="form-select"
            value={trackingType}
            onChange={(e) => {
              const val = e.target.value;
              setTrackingType(val);
              if (val === 'receivable' && icon === 'activity') {
                setIcon('receivable');
              }
            }}
            disabled={isEditing} // preserve tracking type integrity once created
          >
            <option value="general">General Event, Food & Drink (Supports quantities, prices, variants)</option>
            <option value="receivable">Money Receivable (Owed money, loans, split & partial installments)</option>
            <option value="timed">Timed Activity (Live start/stop timers, duration tracking)</option>
            <option value="trip">Trip or Ride (Timer + multiple visited place stops)</option>
            <option value="call">Call or Communication (Participant, incoming/outgoing, call duration)</option>
          </select>
        </div>

        {/* Target Amount for Receivable */}
        {trackingType === 'receivable' && (
          <div className="form-group" style={{ padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-green-glow)' }}>
            <label className="form-label" htmlFor="targetAmount">Total Target Amount ({currency}) *</label>
            <input
              id="targetAmount"
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
          <label className="form-label" htmlFor="categoryId">Category (Optional)</label>
          <select
            id="categoryId"
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
          <label className="form-label" htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            className="form-textarea"
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
              >
                <TrackingIcon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="form-group">
          <label className="form-label">Accent Color</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
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
              >
                {color === c && <Check size={14} color="#000" />}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(isEditing ? `/items/${itemId}` : '/items')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
