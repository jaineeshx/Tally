import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import BottomNav from './components/shared/BottomNav';

function AppContent() {
  const { onboardingComplete } = useApp();

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <Router>
      <div className="flex-1 flex flex-col min-h-dvh">
        <main className="flex-1 flex flex-col overflow-y-auto pb-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
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
      <AppContent />
    </AppProvider>
  );
}
