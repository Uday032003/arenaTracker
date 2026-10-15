import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { AlarmProvider } from './context/AlarmContext.js';
import { ProtectedLayout, PublicLayout } from './components/layout/AppShell.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { SignupPage } from './pages/auth/SignupPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';

// App Pages
import { HomePage } from './pages/HomePage.js';
import { ItemsListPage } from './pages/items/ItemsListPage.js';
import { ItemFormPage } from './pages/items/ItemFormPage.js';
import { ItemDetailsPage } from './pages/items/ItemDetailsPage.js';
import { ActivityFormPage } from './pages/activities/ActivityFormPage.js';
import { ActivityDetailsPage } from './pages/activities/ActivityDetailsPage.js';
import { HistoryPage } from './pages/history/HistoryPage.js';
import { InsightsPage } from './pages/insights/InsightsPage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';
import { RemindersPage } from './pages/reminders/RemindersPage.js';

export function App() {
  return (
    <AuthProvider>
      <AlarmProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected Application Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/items" element={<ItemsListPage />} />
              <Route path="/items/new" element={<ItemFormPage />} />
              <Route path="/items/:itemId" element={<ItemDetailsPage />} />
              <Route path="/items/:itemId/edit" element={<ItemFormPage />} />
              <Route path="/activities/new" element={<ActivityFormPage />} />
              <Route path="/activities/:activityId" element={<ActivityDetailsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AlarmProvider>
    </AuthProvider>
  );
}

export default App;
