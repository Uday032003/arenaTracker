import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState.js';
import { TrackingIcon } from '../components/common/TrackingIcon.js';
import { ActiveTimerCard } from '../components/sessions/ActiveTimerCard.js';
import { Spinner } from '../components/common/Loader.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { Modal } from '../components/common/Modal.js';
import { Header } from '../components/layout/Header.js';
import { ScrollToTop } from '../components/common/ScrollToTop.js';

vi.mock('../context/AuthContext.js', () => ({
  useAuth: () => ({
    user: { name: 'Alex Johnson', email: 'alex@example.com' },
    loading: false,
    logout: vi.fn(),
  }),
}));

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

  it('renders ActiveTimerCard in stopping loading state', () => {
    const session = {
      id: 'session-456',
      item_name: 'Night Ride',
      tracking_type: 'trip',
      item_icon: 'bike',
      started_at: new Date(Date.now() - 60000).toISOString(),
    };

    render(
      React.createElement(ActiveTimerCard, {
        session,
        onStop: () => {},
        isStopping: true,
      })
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Stopping...');
    expect(button.disabled).toBe(true);
  });

  it('renders Spinner with custom size and styles', () => {
    const { container } = render(React.createElement(Spinner, { size: 16, color: '#ff0000' }));
    const span = container.querySelector('span');
    expect(span).toBeDefined();
    expect(span.style.width).toBe('16px');
    expect(span.style.height).toBe('16px');
    expect(span.style.borderTopColor).toBe('rgb(255, 0, 0)');
  });

  it('renders ConfirmDialog in isLoading state with disabled buttons', () => {
    render(
      React.createElement(ConfirmDialog, {
        isOpen: true,
        onClose: () => {},
        onConfirm: () => {},
        title: 'Delete Item',
        confirmText: 'Delete',
        isLoading: true,
      })
    );

    expect(screen.getByText('Processing...')).toBeDefined();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('renders Header and allows toggling profile menu with logout option', () => {
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Header, null)
      )
    );

    // Account menu avatar button
    const avatarBtn = screen.getByRole('button', { name: 'Account Menu' });
    expect(avatarBtn).toBeDefined();

    // Clicking avatar opens the profile menu with user info and logout option
    fireEvent.click(avatarBtn);
    expect(screen.getByText('Alex Johnson')).toBeDefined();
    expect(screen.getByText('alex@example.com')).toBeDefined();
    expect(screen.getByText('Account Settings')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeDefined();
  });

  it('Modal respects closeOnClickOutside={false} and does not trigger onClose on overlay click', () => {
    const handleClose = vi.fn();
    const { container } = render(
      React.createElement(
        Modal,
        {
          isOpen: true,
          onClose: handleClose,
          title: 'Custom Modal',
          closeOnClickOutside: false,
        },
        React.createElement('p', null, 'Modal Content')
      )
    );

    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).toBeDefined();
    fireEvent.click(overlay);
    expect(handleClose).not.toHaveBeenCalled();

    // But clicking the (X) button still closes the modal
    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ScrollToTop resets scroll position to 0 on route navigation', () => {
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;
    document.documentElement.scrollTop = 250;
    document.body.scrollTop = 300;

    let navigateFn;
    function NavTestComponent() {
      const navigate = useNavigate();
      navigateFn = navigate;
      return React.createElement('div', null, 'Page 1');
    }

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/home'] },
        React.createElement(ScrollToTop, null),
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/home', element: React.createElement(NavTestComponent) }),
          React.createElement(Route, { path: '/items', element: React.createElement('div', null, 'Page 2') })
        )
      )
    );

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);

    // Simulate navigating to another page
    document.documentElement.scrollTop = 400;
    document.body.scrollTop = 400;
    scrollToSpy.mockClear();

    act(() => {
      navigateFn('/items');
    });

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });
});

