import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import BottomNav from './components/shared/BottomNav';
import ErrorBoundary from './components/shared/ErrorBoundary';
import OfflineIndicator from './components/shared/OfflineIndicator';

function AppContent() {
  const { onboardingComplete } = useApp();

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <Router>
      <div className="flex-1 flex flex-col min-h-dvh">
        {/* Global offline/sync status pill */}
        <OfflineIndicator />
        {/* Global toast host — rendered once at the app shell level */}
        <Toaster position="top-center" reverseOrder={false} />
        <main className="flex-1 flex flex-col overflow-y-auto pb-6">
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <Home />
              </ErrorBoundary>
            } />
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            } />
            <Route path="/leaderboard" element={
              <ErrorBoundary>
                <Leaderboard />
              </ErrorBoundary>
            } />
            <Route path="/profile" element={
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AppProvider>
      {/* Top-level boundary catches any error from AppProvider itself */}
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
