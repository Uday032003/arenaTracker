import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { BottomNavigation } from './BottomNavigation.js';
import { Header } from './Header.js';
import { ActiveAlarmModal } from '../reminders/ActiveAlarmModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { PageLoader } from '../common/Loader.js';

export function ProtectedLayout() {
  const { user, loading } = useAuth();

  // If authentication check is finished and there is no user, redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="app-container">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
      <ActiveAlarmModal />
    </div>
  );
}

export function PublicLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoader text="Authenticating..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <Outlet />
    </div>
  );
}
