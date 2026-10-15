import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Clock,
  Calendar,
  Tag,
  Phone,
  Navigation,
  Utensils,
  DollarSign,
  User,
  Sparkles,
} from 'lucide-react';
import { itemsApi, variantsApi, activitiesApi } from '../../services/api.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { SkeletonForm } from '../../components/common/Loader.js';
import { Modal } from '../../components/common/Modal.js';

export function ActivityFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialItemId = searchParams.get('itemId') || '';
  const initialVariantId = searchParams.get('variantId') || '';

  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(initialItemId);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);

  // Common activity fields
  const [occurredAt, setOccurredAt] = useState(() => {
    // Current local datetime in YYYY-MM-DDTHH:mm format
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offset);
    return local.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');

  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [callParticipant, setCallParticipant] = useState('');
  const [callContactLabel, setCallContactLabel] = useState('');
  const [callType, setCallType] = useState('incoming');
  const [callDurationMinutes, setCallDurationMinutes] = useState('');
  const [timedDurationMinutes, setTimedDurationMinutes] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const handleNavigateToNewItem = () => {
    const params = new URLSearchParams();
    params.set('returnTo', '/activities/new');
    if (searchQuery.trim()) {
      params.set('name', searchQuery.trim());
    }
    navigate(`/items/new?${params.toString()}`);
  };

  // Quick inline variant creation modal
  const [isNewVariantModalOpen, setIsNewVariantModalOpen] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantLoading, setNewVariantLoading] = useState(false);

  // Load items
  const loadItems = async () => {
    try {
      setFetching(true);
      const res = await itemsApi.getAll();
      setItems(res.data || []);
      if (!selectedItemId && res.data?.length > 0 && initialItemId) {
        setSelectedItemId(initialItemId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load library items');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);

  // When selected item changes, load its variants
  useEffect(() => {
    if (!selectedItemId) {
      setVariants([]);
      return;
    }

    const loadVariants = async () => {
      try {
        const res = await variantsApi.getByItemId(selectedItemId);
        setVariants(res.data || []);
        if (initialVariantId) {
          setSelectedVariantId(initialVariantId);
        } else {
          setSelectedVariantId('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadVariants();
  }, [selectedItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );


  const handleQuickCreateVariant = async (e) => {
    e.preventDefault();
    if (!newVariantName.trim() || !selectedItemId) return;

    try {
      setNewVariantLoading(true);
      const res = await variantsApi.create(selectedItemId, {
        name: newVariantName.trim(),
      });
      const createdVariant = res.data;
      setVariants((prev) => [...prev, createdVariant]);
      setSelectedVariantId(createdVariant.id);
      setIsNewVariantModalOpen(false);
      setNewVariantName('');
    } catch (err) {
      alert(err.message);
    } finally {
      setNewVariantLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError('Please select or create an item first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        itemId: selectedItemId,
        variantId: selectedVariantId || null,
        occurredAt: new Date(occurredAt).toISOString(),
        notes: notes ? notes.trim() : '',
      };

      // Type-specific field mapping
      if (selectedItem?.tracking_type === 'general') {
        if (quantity !== '') payload.quantity = parseFloat(quantity);
        if (price !== '') payload.price = parseFloat(price);
      } else if (selectedItem?.tracking_type === 'receivable') {
        if (price !== '') payload.price = parseFloat(price);
        if (paymentMode) payload.paymentMode = paymentMode;
      } else if (selectedItem?.tracking_type === 'call') {
        if (callParticipant) payload.callParticipant = callParticipant.trim();
        if (callContactLabel) payload.callContactLabel = callContactLabel.trim();
        if (callType) payload.callType = callType;
        if (callDurationMinutes !== '') {
          payload.callDurationSeconds = Math.round(parseFloat(callDurationMinutes) * 60);
        }
      } else if (selectedItem?.tracking_type === 'timed') {
        if (timedDurationMinutes !== '') {
          payload.sessionDurationSeconds = Math.round(parseFloat(timedDurationMinutes) * 60);
        }
      }

      await activitiesApi.create(payload);
      navigate('/history');
    } catch (err) {
      setError(err.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <SkeletonForm title="Activity Logger" />;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
          Log Activity Occurrence
        </h1>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Step 1: Select or Search Item */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <label className="form-label" style={{ margin: 0 }}>
              1. Select Item from Library *
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNavigateToNewItem}
            >
              <Plus size={14} /> Create New Item
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                You have no items in your library yet.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleNavigateToNewItem}
              >
                <Plus size={14} /> Create First Item
              </button>
            </div>
          ) : (
            <div>
              {/* Filter search for item */}
              <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Search item to log (e.g. Chocolate, Walk, Call)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Items quick-select chips */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: 'var(--space-1) 0',
                }}
              >
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="btn btn-sm"
                    style={{
                      backgroundColor: selectedItemId === item.id ? 'var(--accent-green-glow)' : 'var(--bg-input)',
                      border: selectedItemId === item.id ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      color: selectedItemId === item.id ? 'var(--accent-green)' : 'var(--text-primary)',
                      gap: '6px',
                    }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <TrackingIcon name={item.icon} size={14} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Item Details & Optional Variant */}
        {selectedItem && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedItem.color || 'var(--accent-green)',
                }}
              >
                <TrackingIcon name={selectedItem.icon} size={16} />
              </div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                Logging: {selectedItem.name}
              </h3>
              <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
                {selectedItem.tracking_type}
              </span>
            </div>

            {/* Variant selector */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="variantId">
                  Variant / Specific Variety (Optional)
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-green)', padding: '2px' }}
                  onClick={() => setIsNewVariantModalOpen(true)}
                >
                  <Plus size={12} /> Add new variant
                </button>
              </div>

              <select
                id="variantId"
                className="form-select"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
              >
                <option value="">No specific variant (General {selectedItem.name})</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.description ? `(${v.description})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Type Specific Fields */}
            {selectedItem.tracking_type === 'receivable' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(62, 207, 142, 0.08)',
                    border: '1px solid rgba(62, 207, 142, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target to Receive:</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(selectedItem.target_amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Already Collected:</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{Number(selectedItem.total_collected || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining Balance:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                      ₹{Math.max(0, Number(selectedItem.target_amount || 0) - Number(selectedItem.total_collected || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Installment Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 2000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Mode</label>
                    <select
                      className="form-select"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedItem.tracking_type === 'general' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 1, 2.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price / Cost (₹ / $)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 50.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedItem.tracking_type === 'timed' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Manual Duration (Minutes)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 30 (Leave blank if not timing or use live timer on Home)"
                  value={timedDurationMinutes}
                  onChange={(e) => setTimedDurationMinutes(e.target.value)}
                />
              </div>
            )}

            {selectedItem.tracking_type === 'call' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Participant Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mom, Dr. Connor, Client"
                      value={callParticipant}
                      onChange={(e) => setCallParticipant(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contact Label / Tag</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Family, Work, Mentor"
                      value={callContactLabel}
                      onChange={(e) => setCallContactLabel(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Call Type</label>
                    <select
                      className="form-select"
                      value={callType}
                      onChange={(e) => setCallType(e.target.value)}
                    >
                      <option value="incoming">Incoming</option>
                      <option value="outgoing">Outgoing</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="e.g. 15"
                      value={callDurationMinutes}
                      onChange={(e) => setCallDurationMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date, Time & Notes */}
        <div className="card">
          <div className="form-group">
            <label className="form-label" htmlFor="occurredAt">
              Occurrence Date & Time *
            </label>
            <input
              id="occurredAt"
              type="datetime-local"
              className="form-input"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="notes">
              Notes & Memory Highlights (Optional)
            </label>
            <textarea
              id="notes"
              className="form-textarea"
              placeholder="What happened? Any memorable thoughts or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !selectedItemId}
          >
            {loading ? 'Saving Occurrence...' : 'Save Activity Occurrence'}
          </button>
        </div>
      </form>


      {/* Quick Variant Creation Modal */}
      <Modal
        isOpen={isNewVariantModalOpen}
        onClose={() => setIsNewVariantModalOpen(false)}
        title={`Add Variant to ${selectedItem?.name || 'Item'}`}
      >
        <form onSubmit={handleQuickCreateVariant}>
          <div className="form-group">
            <label className="form-label">Variant Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Perk, Dairy Milk, Silk..."
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNewVariantModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={newVariantLoading || !newVariantName.trim()}
            >
              {newVariantLoading ? 'Adding...' : 'Add & Select'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
