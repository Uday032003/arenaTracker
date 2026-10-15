import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../components/common/EmptyState.js';
import { TrackingIcon } from '../components/common/TrackingIcon.js';
import { ActiveTimerCard } from '../components/sessions/ActiveTimerCard.js';

describe('Frontend Component Tests', () => {
  it('renders EmptyState with custom title and description', () => {
    render(
      React.createElement(EmptyState, {
        title: 'Zero Items in Library',
        description: 'Create your first reusable item to begin tracking.',
        actionLabel: 'Create Item',
        onAction: () => {},
      })
    );

    expect(screen.getByText('Zero Items in Library')).toBeDefined();
    expect(screen.getByText('Create your first reusable item to begin tracking.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create Item' })).toBeDefined();
  });

  it('renders TrackingIcon for various tracking types', () => {
    const { container: c1 } = render(React.createElement(TrackingIcon, { name: 'food', size: 20 }));
    expect(c1.querySelector('svg')).toBeDefined();

    const { container: c2 } = render(React.createElement(TrackingIcon, { name: 'footprints', size: 20 }));
    expect(c2.querySelector('svg')).toBeDefined();

    const { container: c3 } = render(React.createElement(TrackingIcon, { name: 'bike', size: 20 }));
    expect(c3.querySelector('svg')).toBeDefined();

    const { container: c4 } = render(React.createElement(TrackingIcon, { name: 'phone', size: 20 }));
    expect(c4.querySelector('svg')).toBeDefined();
  });

  it('renders ActiveTimerCard with item name and stop button', () => {
    const session = {
      id: 'session-123',
      item_name: 'Evening Walk',
      tracking_type: 'timed',
      item_icon: 'footprints',
      started_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      notes: 'Testing park walk',
    };

    render(
      React.createElement(ActiveTimerCard, {
        session,
        onStop: () => {},
      })
    );

    expect(screen.getByText('Evening Walk')).toBeDefined();
    expect(screen.getByText('Active timer session')).toBeDefined();
    expect(screen.getByText('"Testing park walk"')).toBeDefined();
    expect(screen.getByRole('button', { name: /stop session/i })).toBeDefined();
  });
});
