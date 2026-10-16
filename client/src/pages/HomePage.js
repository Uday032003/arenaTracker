import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Play,
  Pin,
  PinOff,
  History,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { dashboardApi, sessionsApi, favoritesApi, itemsApi, placesApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { TrackingIcon } from '../components/common/TrackingIcon.js';
import { ActiveTimerCard } from '../components/sessions/ActiveTimerCard.js';
import { PageLoader, SkeletonCard, SkeletonHome, Spinner } from '../components/common/Loader.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { ErrorBanner } from '../components/common/ErrorMessage.js';
import { Modal } from '../components/common/Modal.js';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pin item modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [pinningState, setPinningState] = useState(null); // { id: item.id, action: 'pin' | 'unpin' }

  // Card action loading states
  const [unpinningId, setUnpinningId] = useState(null);
  const [startingTimerId, setStartingTimerId] = useState(null);
  const [stoppingSessionId, setStoppingSessionId] = useState(null);

  // Add Place modal state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeNotes, setPlaceNotes] = useState('');
  const [placeLoading, setPlaceLoading] = useState(false);

  const fetchDashboard = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const [sumRes, recRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getRecentActivities(10),
      ]);
      setSummary(sumRes.data);
      setRecentActivities(recRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load home dashboard');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStopSession = async (sessionId) => {
    try {
      setStoppingSessionId(sessionId);
      await sessionsApi.stop(sessionId, { createActivityLog: true });
      await fetchDashboard(true);
    } catch (err) {
      alert(err.message || 'Failed to stop session');
    } finally {
      setStoppingSessionId(null);
    }
  };

  const handleStartTimer = async (itemId) => {
    try {
      setStartingTimerId(itemId);
      await sessionsApi.start({ itemId });
      await fetchDashboard(true);
    } catch (err) {
      alert(err.message || 'Failed to start session');
    } finally {
      setStartingTimerId(null);
    }
  };

  const handleUnpin = async (itemId) => {
    try {
      setUnpinningId(itemId);
      await favoritesApi.unpin(itemId);
      await fetchDashboard(true);
    } catch (err) {
      alert(err.message || 'Failed to unpin item');
    } finally {
      setUnpinningId(null);
    }
  };

  const openPinModal = async () => {
    setIsPinModalOpen(true);
    try {
      setLoadingLibrary(true);
      const res = await itemsApi.getAll();
      setLibraryItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleTogglePin = async (item) => {
    if (pinningState) return;
    const action = item.is_pinned ? 'unpin' : 'pin';
    try {
      setPinningState({ id: item.id, action });
      if (item.is_pinned) {
        await favoritesApi.unpin(item.id);
      } else {
        await favoritesApi.pin(item.id);
      }
      // Refresh library items and dashboard in background without page skeleton flicker
      const res = await itemsApi.getAll();
      setLibraryItems(res.data || []);
      await fetchDashboard(true);
    } catch (err) {
      alert(err.message || 'Failed to update pin status');
    } finally {
      setPinningState(null);
    }
  };

  const handleOpenAddPlace = (sessionId) => {
    setCurrentSessionId(sessionId);
    setPlaceName('');
    setPlaceAddress('');
    setPlaceNotes('');
    setIsPlaceModalOpen(true);
  };

  const handleSavePlace = async (e) => {
    e.preventDefault();
    if (!placeName || !currentSessionId) return;
    try {
      setPlaceLoading(true);
      await placesApi.add(currentSessionId, {
        name: placeName,
        address: placeAddress,
        notes: placeNotes,
      });
      setIsPlaceModalOpen(false);
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to add place');
    } finally {
      setPlaceLoading(false);
    }
  };

  if (loading) {
    return <SkeletonHome />;
  }

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: user?.timezone || 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const totalItems = summary?.stats?.totalItems || 0;
  const pinnedItems = summary?.pinnedItems || [];
  const activeSessions = summary?.activeSessions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

      {/* Greeting and Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentDateFormatted}
          </span>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginTop: '2px' }}>
            Hello, {user?.name?.split(' ')[0] || 'Friend'} 👋
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Track reusable activities, preserve life experiences, and review personal memories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={openPinModal}>
            <Pin size={16} />
            <span>Customize Home</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/activities/new')}>
            <Plus size={16} />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Zero items welcome state */}
      {totalItems === 0 && (
        <div className="card" style={{ border: '1px solid var(--border-accent)', backgroundColor: 'rgba(62, 207, 142, 0.04)', padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(62, 207, 142, 0.15)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Your Library Starts Empty
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                Unlike a conventional to-do list, this tracker lets you define reusable items (like <em>Chocolate, Walk, Night Ride, or Call</em>) and record each time you experience them. Start by creating your first item!
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/items/new')}>
                <Plus size={16} />
                <span>Create Your First Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Logs Today
          </span>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-green)', marginTop: 'var(--space-1)' }}>
            {summary?.stats?.logsToday || 0}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            This Week
          </span>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
            {summary?.stats?.logsThisWeek || 0}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Items in Library
          </span>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
            {summary?.stats?.totalItems || 0}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Occurrences
          </span>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-1)' }}>
            {summary?.stats?.totalActivities || 0}
          </div>
        </div>
      </div>

      {/* Active Timed Sessions */}
      {activeSessions.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                boxShadow: '0 0 8px var(--accent-green)',
                display: 'inline-block',
              }}
            />
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              Active Sessions ({activeSessions.length})
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
            {activeSessions.map((session) => (
              <ActiveTimerCard
                key={session.id}
                session={session}
                onStop={handleStopSession}
                onAddPlace={handleOpenAddPlace}
                isStopping={stoppingSessionId === session.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pinned Items on Home */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Pin size={18} color="var(--accent-green)" />
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              Pinned to Home ({pinnedItems.length})
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={openPinModal}>
            Manage Pinned
          </button>
        </div>

        {pinnedItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              No items pinned to Home yet. Customize Home to keep your frequently accessed habits and activities right here.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={openPinModal}>
              <Plus size={14} /> Add Items to Home
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {pinnedItems.map((item) => (
              <div
                key={item.id}
                className="card card-hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.color || 'var(--accent-green)',
                        }}
                      >
                        <TrackingIcon name={item.icon} size={18} />
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
                        {item.category_name && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.category_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px', color: 'var(--text-muted)' }}
                      onClick={() => handleUnpin(item.id)}
                      disabled={unpinningId === item.id}
                      title="Unpin from Home"
                    >
                      {unpinningId === item.id ? <Spinner size={14} color="var(--accent-green)" /> : <PinOff size={14} />}
                    </button>
                  </div>

                  {/* Last Occurrence Display */}
                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      Last occurred:
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        color:
                          item.last_occurrence.status === 'today'
                            ? 'var(--accent-green)'
                            : item.last_occurrence.status === 'yesterday'
                              ? 'var(--info)'
                              : 'var(--text-primary)',
                      }}
                    >
                      {item.last_occurrence.label}
                    </span>
                  </div>
                </div>

                {/* Quick actions for pinned item */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                  {item.tracking_type === 'timed' || item.tracking_type === 'trip' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleStartTimer(item.id)}
                      disabled={startingTimerId === item.id}
                    >
                      {startingTimerId === item.id ? (
                        <>
                          <Spinner size={13} color="currentColor" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Start Timer</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/activities/new?itemId=${item.id}`)}
                    >
                      <Plus size={14} />
                      <span>Log Now</span>
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity Feed */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <History size={18} color="var(--accent-green)" />
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
              Recent Activity ({recentActivities.length})
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            View Full History <ChevronRight size={14} />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No activities logged yet.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {recentActivities.map((act, idx) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: idx < recentActivities.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                }}
                onClick={() => navigate(`/activities/${act.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: act.item_color || 'var(--accent-green)',
                    }}
                  >
                    <TrackingIcon name={act.item_icon} size={16} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                        {act.item_name}
                      </span>
                      {act.variant_name && (
                        <span className="badge badge-green">{act.variant_name}</span>
                      )}
                      {act.call_participant && (
                        <span className="badge badge-blue">{act.call_participant}</span>
                      )}
                      {act.price !== null && (
                        <span className="badge badge-green">
                          {act.item_tracking_type === 'receivable' ? `+ ₹${Number(act.price).toLocaleString()}` : `₹${act.price}`}
                        </span>
                      )}
                      {act.payment_mode && (
                        <span className="badge badge-gray">{act.payment_mode}</span>
                      )}
                    </div>
                    {act.notes && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {act.notes}
                      </p>
                    )}
                  </div>
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

      {/* Pin to Home Selection Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Customize Home Items"
        closeOnClickOutside={false}
        footer={
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsPinModalOpen(false)}
          >
            Done
          </button>
        }
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Select which items from your library should appear on your Home screen.
        </p>

        {loadingLibrary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton" style={{ width: '120px', height: '14px' }} />
                </div>
                <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ))}
          </div>
        ) : libraryItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No items in your library yet.
            </p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'var(--space-2)' }}
              onClick={() => {
                setIsPinModalOpen(false);
                navigate('/items/new');
              }}
            >
              Create Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '350px', overflowY: 'auto' }}>
            {libraryItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <TrackingIcon name={item.icon} size={16} />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{item.name}</span>
                </div>
                <button
                  className={`btn btn-sm ${item.is_pinned ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleTogglePin(item)}
                  disabled={pinningState !== null}
                  style={{
                    minWidth: '100px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {pinningState?.id === item.id ? (
                    <>
                      <Spinner size={13} color="currentColor" />
                      <span>{pinningState.action === 'unpin' ? 'Unpinning...' : 'Pinning...'}</span>
                    </>
                  ) : (
                    <span>{item.is_pinned ? 'Unpin' : 'Pin to Home'}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add Place Modal during Trip */}
      <Modal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        title="Add Visited Place"
      >
        <form onSubmit={handleSavePlace}>
          <div className="form-group">
            <label className="form-label">Place Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Marina Beach, City Bakery"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address / Landmark (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 5th Avenue Corner"
              value={placeAddress}
              onChange={(e) => setPlaceAddress(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Thoughts, stop details, snacks enjoyed..."
              value={placeNotes}
              onChange={(e) => setPlaceNotes(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPlaceModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={placeLoading || !placeName}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {placeLoading && <Spinner size={14} color="currentColor" />}
              <span>{placeLoading ? 'Saving...' : 'Add Place'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
