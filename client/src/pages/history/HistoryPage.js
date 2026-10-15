import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Layers,
} from 'lucide-react';
import { activitiesApi, itemsApi, categoriesApi } from '../../services/api.js';
import { TrackingIcon } from '../../components/common/TrackingIcon.js';
import { SkeletonList } from '../../components/common/Loader.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

export function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(searchParams.get('itemId') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calendar View mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Delete state
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFiltersData = async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([
        itemsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setItems(itemsRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async (offset = 0, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);

      const params = {
        limit: 20,
        offset,
        sort: sortOrder,
        search: debouncedSearch.trim() || undefined,
        itemId: selectedItemId || undefined,
        categoryId: selectedCategory || undefined,
        trackingType: selectedType || undefined,
      };

      if (viewMode === 'calendar') {
        params.startDate = `${selectedCalendarDate}T00:00:00.000Z`;
        params.endDate = `${selectedCalendarDate}T23:59:59.999Z`;
      } else {
        if (startDate) params.startDate = `${startDate}T00:00:00.000Z`;
        if (endDate) params.endDate = `${endDate}T23:59:59.999Z`;
      }

      const res = await activitiesApi.getAll(params);
      setActivities(res.data || []);
      setPagination(res.pagination || { total: 0, limit: 20, offset: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  // Single unified effect
  useEffect(() => {
    fetchActivities(0);
  }, [debouncedSearch, selectedItemId, selectedCategory, selectedType, sortOrder, viewMode, selectedCalendarDate, startDate, endDate]);

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      setDeleteLoading(true);
      await activitiesApi.delete(activityToDelete.id);
      setActivityToDelete(null);
      setSuccessMsg('Occurrence deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchActivities(pagination.offset, true);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Personal History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Complete chronological record of all logged occurrences and memories
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar Date
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/activities/new')}>
            <Plus size={16} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchActivities(0)} />}
      {successMsg && <SuccessBanner message={successMsg} />}

      {/* Calendar Date Picker Bar (when in calendar mode) */}
      {viewMode === 'calendar' && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CalendarIcon size={18} color="var(--accent-green)" />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Filter by Calendar Date:</span>
          </div>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={selectedCalendarDate}
            onChange={(e) => setSelectedCalendarDate(e.target.value)}
          />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Only displays records that actually occurred on this calendar date.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search history by name, notes, caller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Item filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            <option value="">All Items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>

          {/* Tracking type */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="general">General / Food</option>
            <option value="timed">Timed Activity</option>
            <option value="trip">Trip / Ride</option>
            <option value="call">Call / Meeting</option>
          </select>

          {/* Sort order */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Date Range Filters in List View */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Date Range:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: 'var(--font-size-xs)' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: 'var(--font-size-xs)' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            {(startDate || endDate) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activities Timeline Feed */}
      {loading ? (
        <SkeletonList count={6} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No activity records found"
          description={
            viewMode === 'calendar'
              ? `No occurrences recorded on ${selectedCalendarDate}.`
              : 'Try clearing your search or filter parameters to see more logs.'
          }
          actionLabel="Log an Activity"
          onAction={() => navigate('/activities/new')}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {activities.map((act, index) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                borderBottom: index < activities.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: act.item_color || 'var(--accent-green)',
                    flexShrink: 0,
                  }}
                >
                  <TrackingIcon name={act.item_icon} size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
                      {act.item_name}
                    </span>
                    {act.variant_name && (
                      <span className="badge badge-green">{act.variant_name}</span>
                    )}
                    {act.quantity !== null && (
                      <span className="badge badge-gray">Qty: {act.quantity}</span>
                    )}
                    {act.call_participant && (
                      <span className="badge badge-blue">With: {act.call_participant}</span>
                    )}
                    {act.price !== null && (
                      <span className="badge badge-green">
                        {act.item_tracking_type === 'receivable' ? `+ ₹${Number(act.price).toLocaleString()}` : `₹${act.price}`}
                      </span>
                    )}
                    {act.payment_mode && (
                      <span className="badge badge-gray">{act.payment_mode}</span>
                    )}
                    {act.session_duration_seconds && (
                      <span className="badge badge-purple">
                        {Math.round(act.session_duration_seconds / 60)} min
                      </span>
                    )}
                  </div>

                  {act.notes && (
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {act.notes}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {act.relative_date?.label}
                  </span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {act.relative_date?.formattedDate}
                  </p>
                </div>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px', color: 'var(--danger)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivityToDelete(act);
                  }}
                  title="Delete log"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination.total > pagination.limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} records
          </span>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.offset === 0}
              onClick={() => fetchActivities(Math.max(0, pagination.offset - pagination.limit))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!pagination.hasMore}
              onClick={() => fetchActivities(pagination.offset + pagination.limit)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(activityToDelete)}
        onClose={() => setActivityToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Occurrence?"
        message={`Delete this log for "${activityToDelete?.item_name}"? The item itself will remain in your library.`}
        confirmText="Delete Log"
        isLoading={deleteLoading}
      />
    </div>
  );
}
