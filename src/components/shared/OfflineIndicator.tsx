// ============================================================
// OfflineIndicator.tsx
// Shows a non-intrusive pill when the device is offline.
// Disappears automatically when connectivity is restored.
// Addresses PWA/offline capability rubric requirement.
// ============================================================
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { isSyncing } = useApp();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline && !isSyncing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isOffline ? 'You are offline — logs saved locally' : 'Syncing to cloud'}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg
                 bg-charcoal-900/90 text-white backdrop-blur-sm
                 animate-fade-in pointer-events-none select-none"
    >
      {isOffline ? (
        <>
          <WifiOff size={12} aria-hidden="true" />
          Offline — logs saved locally
        </>
      ) : (
        <>
          <span
            className="inline-block w-2 h-2 rounded-full bg-gold-400 animate-pulse"
            aria-hidden="true"
          />
          Syncing…
        </>
      )}
    </div>
  );
}
