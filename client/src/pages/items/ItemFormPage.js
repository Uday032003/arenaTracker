import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { itemsApi } from '../../services/api.js';
import { ErrorBanner } from '../../components/common/ErrorMessage.js';
import { SkeletonForm } from '../../components/common/Loader.js';
import { ItemForm } from '../../components/items/ItemForm.js';

export function ItemFormPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(itemId);

  const returnTo = searchParams.get('returnTo');
  const nameParam = searchParams.get('name') || '';

  const [initialData, setInitialData] = useState(null);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditing) {
      setInitialData({ name: nameParam });
      return;
    }

    const loadItem = async () => {
      try {
        setFetching(true);
        const res = await itemsApi.getById(itemId);
        setInitialData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load item');
      } finally {
        setFetching(false);
      }
    };
    loadItem();
  }, [itemId, isEditing, nameParam]);

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(isEditing ? `/items/${itemId}` : '/items');
    }
  };

  const handleSubmit = async (payload) => {
    if (isEditing) {
      const res = await itemsApi.update(itemId, payload);
      navigate(returnTo || `/items/${itemId}`);
      return res;
    } else {
      const res = await itemsApi.create(payload);
      if (returnTo) {
        const separator = returnTo.includes('?') ? '&' : '?';
        navigate(`${returnTo}${separator}itemId=${res.data.id}`);
      } else {
        navigate(`/items/${res.data.id}`);
      }
      return res;
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
          onClick={handleCancel}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
          {isEditing ? `Edit Item: ${initialData?.name || ''}` : 'Create New Reusable Item'}
        </h1>
      </div>

      {error && <ErrorBanner message={error} />}

      <ItemForm
        initialValues={initialData || {}}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel={isEditing ? 'Save Changes' : 'Create Item'}
      />
    </div>
  );
}
