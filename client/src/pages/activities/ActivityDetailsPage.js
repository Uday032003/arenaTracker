import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Phone,
  Navigation,
  Tag,
  DollarSign,
  User,
  MapPin,
} from 'lucide-react';
import { activitiesApi } from '../../services/api.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';
import { SkeletonActivityDetails } from '../../components/common/Loader.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { Modal } from '../../components/common/Modal.js';

export function ActivityDetailsPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit notes state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editOccurredAt, setEditOccurredAt] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activitiesApi.getById(activityId);
      setActivity(res.data);
      setEditNotes(res.data.notes || '');
      if (res.data.occurred_at) {
        const d = new Date(res.data.occurred_at);
        const offset = d.getTimezoneOffset() * 60000;
        const local = new Date(d.getTime() - offset);
        setEditOccurredAt(local.toISOString().slice(0, 16));
      }
    } catch (err) {
      setError(err.message || 'Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [activityId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      await activitiesApi.update(activityId, {
        notes: editNotes,
        occurredAt: new Date(editOccurredAt).toISOString(),
      });
      setIsEditOpen(false);
      setSuccessMsg('Activity updated successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchActivity();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await activitiesApi.delete(activityId);
      navigate(-1);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonActivityDetails />;
  }

  if (!activity) {
    return (
      <div>
        <ErrorBanner message="Activity not found" />
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {successMsg && <SuccessBanner message={successMsg} />}

      {/* Main Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activity.item_color || 'var(--accent-green)',
            }}
          >
            <TrackingIcon name={activity.item_icon} size={24} />
          </div>

          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
              {activity.item_name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
              {activity.variant_name && (
                <span className="badge badge-green">{activity.variant_name}</span>
              )}
              {activity.category_name && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  {activity.category_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date and Relative Time */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={16} color="var(--accent-green)" />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              {activity.relative_date?.formattedDate}
            </span>
            <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
              {activity.relative_date?.label}
            </span>
          </div>
        </div>

        {/* Specialized metadata */}
        {(activity.quantity !== null || activity.price !== null || activity.call_participant || activity.session_duration_seconds) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {activity.quantity !== null && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Quantity</span>
                <p style={{ fontWeight: 600 }}>{activity.quantity}</p>
              </div>
            )}
            {activity.price !== null && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {activity.item_tracking_type === 'receivable' ? 'Installment Received' : 'Price'}
                </span>
                <p style={{ fontWeight: 600, color: activity.item_tracking_type === 'receivable' ? 'var(--accent-green)' : 'inherit' }}>
                  ₹{Number(activity.price).toLocaleString()}
                </p>
              </div>
            )}
            {activity.payment_mode && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Payment Mode</span>
                <p style={{ fontWeight: 600 }}>{activity.payment_mode}</p>
              </div>
            )}
            {activity.call_participant && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Call With</span>
                <p style={{ fontWeight: 600 }}>{activity.call_participant} ({activity.call_type || 'call'})</p>
              </div>
            )}
            {activity.call_duration_seconds && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Call Duration</span>
                <p style={{ fontWeight: 600 }}>{Math.round(activity.call_duration_seconds / 60)} mins</p>
              </div>
            )}
            {activity.session_duration_seconds && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Session Duration</span>
                <p style={{ fontWeight: 600 }}>{Math.round(activity.session_duration_seconds / 60)} mins</p>
              </div>
            )}
          </div>
        )}

        {/* Visited Places during Trip */}
        {activity.places && activity.places.length > 0 && (
          <div>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Places Visited ({activity.places.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {activity.places.map((place) => (
                <div
                  key={place.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <MapPin size={16} color="var(--accent-green)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{place.name}</p>
                    {place.address && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{place.address}</p>
                    )}
                    {place.notes && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{place.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {activity.notes && (
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Notes & Highlights
            </span>
            <p style={{ marginTop: '4px', fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {activity.notes}
            </p>
          </div>
        )}

        {/* Navigation link to parent item */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
          <Link
            to={`/items/${activity.item_id}`}
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--accent-green)', fontWeight: 500 }}
          >
            View all {activity.item_name} logs & item details →
          </Link>
        </div>
      </div>

      {/* Edit Occurrence Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Activity Occurrence"
      >
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Occurrence Date & Time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={editOccurredAt}
              onChange={(e) => setEditOccurredAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingEdit}
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this occurrence?"
        message="Are you sure you want to delete this recorded activity occurrence? The item itself will remain in your library."
        confirmText="Delete Occurrence"
        isLoading={deleting}
      />
    </div>
  );
}
