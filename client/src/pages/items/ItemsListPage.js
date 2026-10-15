import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Layers,
  Archive,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { itemsApi, categoriesApi, favoritesApi, sessionsApi } from '../../services/api.js';
import { ItemCard } from '../../components/items/ItemCard.js';
import { PageLoader, SkeletonCard } from '../../components/common/Loader.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { ErrorBanner, SuccessBanner } from '../../components/common/ErrorMessage.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

export function ItemsListPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState('last_occurrence_desc');
  const [viewArchived, setViewArchived] = useState(false);

  // Delete dialog state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load categories once on mount
  useEffect(() => {
    categoriesApi.getAll()
      .then((catRes) => setCategories(catRes.data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  const fetchItems = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const itemsRes = await itemsApi.getAll({
        search: debouncedSearch.trim() || undefined,
        categoryId: selectedCategory || undefined,
        trackingType: selectedType || undefined,
        sort: selectedSort,
        archived: viewArchived ? 'true' : 'false',
      });
      setItems(itemsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load items');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Single unified effect for fetching items
  useEffect(() => {
    fetchItems();
  }, [debouncedSearch, selectedCategory, selectedType, selectedSort, viewArchived]);

  const handleTogglePin = async (item) => {
    try {
      if (item.is_pinned) {
        await favoritesApi.unpin(item.id);
      } else {
        await favoritesApi.pin(item.id);
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_pinned: !i.is_pinned } : i))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (item) => {
    try {
      const nextState = !item.is_archived;
      await itemsApi.archive(item.id, nextState);
      setSuccessMsg(nextState ? `"${item.name}" archived.` : `"${item.name}" restored.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteLoading(true);
      await itemsApi.delete(itemToDelete.id);
      setItemToDelete(null);
      setSuccessMsg(`"${itemToDelete.name}" and its history were deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStartTimer = async (itemId) => {
    try {
      await sessionsApi.start({ itemId });
      navigate('/home');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Items Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Reusable templates for food, habits, rides, calls, and daily experiences
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/items/new')}>
          <Plus size={16} />
          <span>New Item</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchItems} />}
      {successMsg && <SuccessBanner message={successMsg} />}

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
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search items by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tracking Type Filter */}
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

          {/* Sort Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
          >
            <option value="last_occurrence_desc">Recently Logged</option>
            <option value="last_occurrence_asc">Oldest Logged</option>
            <option value="name_asc">Name (A - Z)</option>
            <option value="occurrences_desc">Most Occurrences</option>
            <option value="created_desc">Newly Created</option>
          </select>
        </div>

        {/* Active vs Archived Toggle */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${!viewArchived ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontWeight: !viewArchived ? 600 : 400 }}
            onClick={() => setViewArchived(false)}
          >
            Active Items
          </button>
          <button
            className={`btn btn-sm ${viewArchived ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ fontWeight: viewArchived ? 600 : 400 }}
            onClick={() => setViewArchived(true)}
          >
            Archived Items
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="layers"
          title={viewArchived ? 'No archived items' : search ? 'No items match your search' : 'Your Items Library is empty'}
          description={
            viewArchived
              ? 'Archived items will appear here when you hide them from active views.'
              : search
                ? 'Try adjusting your search terms or filter criteria.'
                : 'Every new account starts with 0 items. Create reusable templates like Chocolate, Milk, Walk, Night Ride, or Call to start logging.'
          }
          actionLabel={viewArchived ? null : search ? 'Clear Search' : 'Create First Item'}
          onAction={viewArchived ? null : search ? () => setSearch('') : () => navigate('/items/new')}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onTogglePin={handleTogglePin}
              onArchive={handleArchive}
              onDelete={(itm) => setItemToDelete(itm)}
              onStartTimer={handleStartTimer}
            />
          ))}
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete "${itemToDelete?.name}"?`}
        message={`Are you sure you want to delete "${itemToDelete?.name}"? All associated activity logs, variants, and session history will also be permanently deleted.`}
        confirmText="Permanently Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
}
