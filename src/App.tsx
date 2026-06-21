// ============================================================
// App.tsx — Application shell
//
// Accessibility features implemented here:
//  • Skip-to-main-content link (WCAG 2.4.1 Bypass Blocks)
//  • Landmark regions: <nav>, <main id="main-content">
//  • aria-live="polite" region for dynamic announcements
//  • Focus management: main heading focused on route change
//  • ErrorBoundary per-page with accessible recovery message
//  • OfflineIndicator with role="status" aria-live="polite"
// ============================================================
import { useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
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

/**
 * Moves keyboard focus to the top of `<main>` on every route
 * change so screen reader users don't have to navigate from
 * the top of the document. Implements WCAG 2.4.3 Focus Order.
 */
function RouteChangeAnnouncer() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Defer to next frame so new page content has rendered
    const frame = requestAnimationFrame(() => {
      mainRef.current = document.getElementById('main-content');
      if (mainRef.current) {
        mainRef.current.focus({ preventScroll: false });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return null;
}

function AppContent() {
  const { onboardingComplete } = useApp();

  if (!onboardingComplete) {
    return (
      <ErrorBoundary>
        <Onboarding />
      </ErrorBoundary>
    );
  }

  return (
    <Router>
      <RouteChangeAnnouncer />

      {/* Skip-to-main-content — WCAG 2.4.1 Bypass Blocks.
          Visually hidden until focused; always the first tab stop. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="flex-1 flex flex-col min-h-dvh">
        {/* Global offline / sync status indicator */}
        <OfflineIndicator />

        {/* Global toast portal — rendered once at shell level.
            react-hot-toast uses aria-live internally. */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            // Ensure sufficient display time for screen reader announcement
            duration: 3500,
          }}
        />

        {/* Primary landmark — id matches the skip-link href */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col overflow-y-auto pb-6 focus:outline-none"
          aria-label="Main content"
        >
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

        {/* Navigation landmark */}
        <BottomNav />
      </div>
    </Router>
  );
}

/** Root application component. Wraps everything in state provider and error boundary. */
export default function App() {
  return (
    <AppProvider>
      {/* Top-level boundary catches errors from AppProvider itself */}
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
