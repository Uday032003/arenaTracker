import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Plus,
  Play,
  Edit2,
  Archive,
  RefreshCw,
  Pin,
  PinOff,
  Tag,
  Trash2,
  Calendar,
  Layers,
  Activity,
  History,
} from 'lucide-react';
import { itemsApi, variantsApi, activitiesApi, sessionsApi, favoritesApi } from '../../services/api.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';
import { SkeletonItemDetails, Spinner } from '../../components/common/Loader.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

function getVariantContextHelp(item) {
  if (!item) {
    return {
      description: 'Variants allow you to track sub-types, routines, or varieties without creating duplicate items.',
      placeholder: 'e.g. Variant name...',
      descPlaceholder: 'Optional details about this variety...',
    };
  }

  const name = (item.name || '').toLowerCase();
  const type = (item.tracking_type || '').toLowerCase();
  const icon = (item.icon || '').toLowerCase();

  // 1. Fitness / Gym / Workout
  if (name.includes('gym') || name.includes('workout') || name.includes('fitness') || name.includes('exercise') || icon === 'dumbbell') {
    return {
      description: 'Variants allow you to track specific routines or muscle splits (e.g. Chest & Triceps, Push Day, Leg Day, Cardio) under this gym item.',
      placeholder: 'e.g. Chest & Triceps, Push Day, Leg Day...',
      descPlaceholder: 'e.g. 4 sets bench press, dumbbell flyes...',
    };
  }

  // 2. Study / Coding / Deep Work
  if (name.includes('study') || name.includes('code') || name.includes('coding') || name.includes('deep work') || name.includes('read') || icon === 'book') {
    return {
      description: 'Variants allow you to track subjects, topics, or chapters (e.g. React.js, System Design, DSA, Chapter 4) under this study item.',
      placeholder: 'e.g. React.js, System Design, Chapter 4...',
      descPlaceholder: 'e.g. Focused modules or book pages...',
    };
  }

  // 3. Coffee / Tea / Drinks
  if (name.includes('coffee') || name.includes('tea') || name.includes('chai') || icon === 'coffee') {
    return {
      description: 'Variants allow you to track preparations or flavours (e.g. Espresso, Cappuccino, Masala Chai, Green Tea) under this item.',
      placeholder: 'e.g. Espresso, Cappuccino, Masala Chai...',
      descPlaceholder: 'e.g. Double shot, oat milk...',
    };
  }

  // 4. Trips / Rides / Commutes
  if (type === 'trip' || name.includes('commute') || name.includes('ride') || name.includes('trip') || icon === 'car' || icon === 'bike') {
    return {
      description: 'Variants allow you to track specific routes or transport options (e.g. Highway Route, Via Metro, Bike Route) under this item.',
      placeholder: 'e.g. Highway Route, Via Metro, Morning Ride...',
      descPlaceholder: 'e.g. Via Outer Ring Road, 35km...',
    };
  }

  // 5. Calls / Communications
  if (type === 'call' || name.includes('call') || icon === 'phone') {
    return {
      description: 'Variants allow you to track call types or topics (e.g. Weekly Status Sync, Quick Catch-up, Advisory) under this item.',
      placeholder: 'e.g. Project Sync, Catch-up Call, 1-on-1...',
      descPlaceholder: 'e.g. Discuss roadmap, sprint review...',
    };
  }

  // 6. Food / Snacks / Dining
  if (name.includes('chocolate') || name.includes('biryani') || name.includes('food') || name.includes('snack') || name.includes('pizza') || icon === 'utensils') {
    return {
      description: 'Variants allow you to track sub-types, brands, or flavours (e.g. Dark Chocolate, Cappuccino, Margherita Pizza) under this item.',
      placeholder: 'e.g. Dark Chocolate, Margherita, Paradise Biryani...',
      descPlaceholder: 'e.g. Extra toppings, 85% cocoa...',
    };
  }

  // 7. General Fallback
  return {
    description: 'Variants allow you to track sub-types, routines, or varieties (e.g. Push Day for Gym, Cappuccino for Coffee, or Dark Chocolate for Snacks) without creating duplicate items.',
    placeholder: 'e.g. Push Day, Cappuccino, Chapter 1, Dark Chocolate...',
    descPlaceholder: 'Optional details about this variety...',
  };
}

export function ItemDetailsPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Variant management state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [variantName, setVariantName] = useState('');
  const [variantDescription, setVariantDescription] = useState('');
  const [variantLoading, setVariantLoading] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pinningAction, setPinningAction] = useState(null); // 'pin' | 'unpin' | null
  const [archivingAction, setArchivingAction] = useState(null); // 'archive' | 'restore' | null

  const fetchItemData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemRes, statsRes, actRes] = await Promise.all([
        itemsApi.getById(itemId),
        itemsApi.getStats(itemId),
        activitiesApi.getAll({ itemId, limit: 15 }),
      ]);
      setItem(itemRes.data);
      setStats(statsRes.data);
      setActivities(actRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [itemId]);

  const handleTogglePin = async () => {
    if (pinningAction) return;
    const action = item.is_pinned ? 'unpin' : 'pin';
    try {
      setPinningAction(action);
      let nextPinned = false;
      if (item.is_pinned) {
        await favoritesApi.unpin(item.id);
        nextPinned = false;
      } else {
        await favoritesApi.pin(item.id);
        nextPinned = true;
      }
      setItem((prev) => ({ ...prev, is_pinned: nextPinned }));
    } catch (err) {
      alert(err.message || 'Failed to update pin');
    } finally {
      setPinningAction(null);
    }
  };

  const handleArchive = async () => {
    if (archivingAction) return;
    const action = item.is_archived ? 'restore' : 'archive';
    try {
      setArchivingAction(action);
      const nextState = !item.is_archived;
      await itemsApi.archive(item.id, nextState);
      setItem((prev) => ({ ...prev, is_archived: nextState }));
      setSuccessMsg(nextState ? 'Item archived' : 'Item restored');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to archive item');
    } finally {
      setArchivingAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await itemsApi.delete(item.id);
      navigate('/items');
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenAddVariant = () => {
    setEditingVariant(null);
    setVariantName('');
    setVariantDescription('');
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (v) => {
    setEditingVariant(v);
    setVariantName(v.name || '');
    setVariantDescription(v.description || '');
    setIsVariantModalOpen(true);
  };

  const handleCloseVariantModal = () => {
    setIsVariantModalOpen(false);
    setEditingVariant(null);
    setVariantName('');
    setVariantDescription('');
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!variantName.trim()) return;

    try {
      setVariantLoading(true);
      if (editingVariant) {
        await variantsApi.update(editingVariant.id, {
          name: variantName.trim(),
          description: variantDescription.trim(),
        });
        setSuccessMsg(`Variant "${variantName.trim()}" updated successfully.`);
      } else {
        await variantsApi.create(itemId, {
          name: variantName.trim(),
          description: variantDescription.trim(),
        });
        setSuccessMsg(`Variant "${variantName.trim()}" created successfully.`);
      }
      handleCloseVariantModal();
      fetchItemData();
    } catch (err) {
      alert(err.message || 'Failed to save variant');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleDeleteVariantConfirm = async () => {
    if (!variantToDelete) return;
    try {
      setVariantLoading(true);
      await variantsApi.delete(variantToDelete.id);
      setSuccessMsg(`Variant "${variantToDelete.name}" removed successfully.`);
      setVariantToDelete(null);
      fetchItemData();
    } catch (err) {
      alert(err.message || 'Failed to remove variant');
    } finally {
      setVariantLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      await sessionsApi.start({ itemId });
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <SkeletonItemDetails />;
  }

  if (!item) {
    return (
      <div>
        <ErrorBanner message="Item not found" />
        <button className="btn btn-secondary" onClick={() => navigate('/items')}>
          Back to Library
        </button>
      </div>
    );
  }

  const formatSeconds = (secs) => {
    if (!secs) return '0 min';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/items')}>
          <ArrowLeft size={16} />
          <span>Items Library</span>
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTogglePin}
            disabled={pinningAction !== null}
            style={{
              color:
                pinningAction !== null
                  ? pinningAction === 'unpin'
                    ? 'var(--accent-green)'
                    : 'inherit'
                  : item.is_pinned
                  ? 'var(--accent-green)'
                  : 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {pinningAction !== null ? (
              <>
                <Spinner size={13} color="currentColor" />
                <span>{pinningAction === 'unpin' ? 'Unpinning...' : 'Pinning...'}</span>
              </>
            ) : (
              <>
                {item.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                <span>{item.is_pinned ? 'Unpin' : 'Pin to Home'}</span>
              </>
            )}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/items/${item.id}/edit`)}>
            <Edit2 size={14} />
            <span>Edit</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleArchive}
            disabled={archivingAction !== null}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {archivingAction !== null ? (
              <>
                <Spinner size={13} color="currentColor" />
                <span>{archivingAction === 'restore' ? 'Restoring...' : 'Archiving...'}</span>
              </>
            ) : (
              <>
                {item.is_archived ? <RefreshCw size={14} /> : <Archive size={14} />}
                <span>{item.is_archived ? 'Restore' : 'Archive'}</span>
              </>
            )}
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {successMsg && <SuccessBanner message={successMsg} />}

      {/* Main Item Hero Card */}
      <div
        className="card"
        style={{
          borderLeft: `6px solid ${item.color || 'var(--accent-green)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color || 'var(--accent-green)',
              }}
            >
              <TrackingIcon name={item.icon} size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                  {item.name}
                </h1>
                {item.is_archived && <span className="badge badge-gray">Archived</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                  {item.tracking_type} Tracking
                </span>
                {item.category_name && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Category: <strong>{item.category_name}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {item.tracking_type === 'timed' || item.tracking_type === 'trip' ? (
              <button className="btn btn-primary" onClick={handleStartTimer}>
                <Play size={16} />
                <span>Start {item.tracking_type === 'trip' ? 'Ride' : 'Timer'}</span>
              </button>
            ) : null}

            <button
              className="btn btn-primary"
              onClick={() => navigate(`/activities/new?itemId=${item.id}`)}
            >
              <Plus size={16} />
              <span>{item.tracking_type === 'receivable' ? 'Record Installment' : 'Log Occurrence'}</span>
            </button>
          </div>
        </div>

        {item.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
            {item.description}
          </p>
        )}

        {/* Hero KPI Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-4)',
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Logged
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: '2px' }}>
              {item.total_occurrences || 0} times
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Last Occurrence
            </span>
            <div
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 700,
                marginTop: '2px',
                color:
                  item.last_occurrence.status === 'today'
                    ? 'var(--accent-green)'
                    : item.last_occurrence.status === 'yesterday'
                      ? 'var(--info)'
                      : 'var(--text-primary)',
              }}
            >
              {item.last_occurrence.label}
            </div>
            {item.last_occurrence.formattedDate && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {item.last_occurrence.formattedDate}
              </span>
            )}
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Gap
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: '2px' }}>
              {stats?.avgDaysBetween ? `${stats.avgDaysBetween} days` : 'N/A'}
            </div>
          </div>

          {stats?.totalDurationSeconds > 0 && (
            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Duration
              </span>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: '2px' }}>
                {formatSeconds(stats.totalDurationSeconds)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receivable Progress Card */}
      {item.tracking_type === 'receivable' && (() => {
        const targetAmount = Number(item.target_amount) || 0;
        const totalCollected = Number(item.total_collected) || 0;
        const remainingBalance = Math.max(0, targetAmount - totalCollected);
        const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;
        const isCompleted = targetAmount > 0 && totalCollected >= targetAmount;

        return (
          <section
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.08) 0%, rgba(20, 20, 20, 0.4) 100%)',
              border: '1px solid rgba(62, 207, 142, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Receivable Collection Progress
                </span>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginTop: '2px' }}>
                  {isCompleted ? 'Fully Collected! 🎉' : `₹${totalCollected.toLocaleString()} of ₹${targetAmount.toLocaleString()} collected`}
                </h2>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/activities/new?itemId=${item.id}`)}
              >
                <Plus size={14} />
                <span>Record Installment</span>
              </button>
            </div>

            {/* Visual Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{progressPercent}% Received</span>
                <span style={{ color: isCompleted ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 600 }}>
                  {isCompleted ? 'Target Achieved' : `₹${remainingBalance.toLocaleString()} Remaining`}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: isCompleted
                      ? 'var(--accent-green)'
                      : 'linear-gradient(90deg, #10b981 0%, #3ecf8e 100%)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Metric Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'var(--space-3)',
                paddingTop: 'var(--space-2)',
              }}
            >
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Target to Receive</span>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  ₹{targetAmount.toLocaleString()}
                </p>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total Received</span>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
                  ₹{totalCollected.toLocaleString()}
                </p>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Balance Remaining</span>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: isCompleted ? 'var(--accent-green)' : 'var(--accent-amber)', marginTop: '2px' }}>
                  ₹{remainingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Variants & Sub-Items Section */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Tag size={18} color="var(--accent-green)" />
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              Variants & Varieties ({item.variants?.length || 0})
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleOpenAddVariant}>
            <Plus size={14} /> Add Variant
          </button>
        </div>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          {getVariantContextHelp(item).description}
        </p>

        {(!item.variants || item.variants.length === 0) ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              No variants defined for this item yet.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {item.variants.map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{v.name}</span>
                {v.description && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    ({v.description})
                  </span>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'var(--space-1)' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', color: 'var(--accent-green)', height: '24px' }}
                    onClick={() => navigate(`/activities/new?itemId=${item.id}&variantId=${v.id}`)}
                    title={`Log occurrence with ${v.name}`}
                  >
                    <Plus size={12} /> Log
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', color: 'var(--text-secondary)', height: '24px' }}
                    onClick={() => handleOpenEditVariant(v)}
                    title={`Edit ${v.name}`}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', color: 'var(--danger)', height: '24px' }}
                    onClick={() => setVariantToDelete(v)}
                    title={`Remove ${v.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Item Occurrences History */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <History size={18} color="var(--accent-green)" />
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              Recent Occurrences ({activities.length})
            </h2>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/history?itemId=${item.id}`)}
          >
            All History
          </button>
        </div>

        {activities.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              This item has never been logged. Record an occurrence to start measuring its history.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/activities/new?itemId=${item.id}`)}
            >
              <Plus size={14} /> Log First Occurrence
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {activities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/activities/${act.id}`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {item.tracking_type === 'receivable' && act.price !== null
                        ? `+ ₹${Number(act.price).toLocaleString()} Received`
                        : (act.variant_name || item.name)}
                    </span>
                    {act.payment_mode && (
                      <span className="badge badge-green">{act.payment_mode}</span>
                    )}
                    {act.quantity && (
                      <span className="badge badge-gray">Qty: {act.quantity}</span>
                    )}
                    {act.price !== null && item.tracking_type !== 'receivable' && (
                      <span className="badge badge-gray">₹{act.price}</span>
                    )}
                    {act.call_participant && (
                      <span className="badge badge-blue">With: {act.call_participant}</span>
                    )}
                  </div>
                  {act.notes && (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {act.notes}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {act.relative_date?.label}
                  </span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {act.relative_date?.formattedDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={handleCloseVariantModal}
        title={editingVariant ? `Edit Variant: ${editingVariant.name}` : `Add Variant to ${item.name}`}
      >
        <form onSubmit={handleSaveVariant}>
          <div className="form-group">
            <label className="form-label">Variant Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder={getVariantContextHelp(item).placeholder}
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder={getVariantContextHelp(item).descPlaceholder}
              value={variantDescription}
              onChange={(e) => setVariantDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseVariantModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={variantLoading || !variantName.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {variantLoading && <Spinner size={14} color="currentColor" />}
              <span>
                {variantLoading
                  ? editingVariant
                    ? 'Saving...'
                    : 'Adding...'
                  : editingVariant
                  ? 'Save Changes'
                  : 'Add Variant'}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Variant Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(variantToDelete)}
        onClose={() => setVariantToDelete(null)}
        onConfirm={handleDeleteVariantConfirm}
        title="Remove Variant"
        message={`Are you sure you want to remove variant "${variantToDelete?.name}"? Past activities recorded with this variant will still keep their history.`}
        confirmText="Remove Variant"
        isDanger={true}
        isLoading={variantLoading}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${item.name}"?`}
        message={`Are you sure you want to permanently delete "${item.name}"? All ${item.total_occurrences || 0} occurrences and variants will be deleted.`}
        confirmText="Permanently Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
}
