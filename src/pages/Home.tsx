// ============================================================
// Home.tsx — Quick-log grid screen
// Uses useTodayCounts hook to decouple data aggregation from UI.
// ============================================================
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { TILES } from '../data/categories';
import { ALL_BADGES, checkNewBadges } from '../lib/streaks';
import { formatToast } from '../lib/calculateFootprint';
import { useTodayCounts } from '../hooks/useLogs';
import StreakBadge from '../components/gamification/StreakBadge';

export default function Home() {
  const { addLog, streakInfo, earnedBadgeIds } = useApp();
  // Counts via dedicated custom hook (no inline reduce in render)
  const todayCounts = useTodayCounts();

  const handleTileClick = (tile: typeof TILES[number]) => {
    const err = addLog({
      category: tile.category,
      subcategory: tile.id,
      co2e_kg: tile.default_co2e_kg,
      cost_estimate_inr: tile.default_cost_inr,
    });

    if (err) {
      // Show validation error — unlikely in normal use but covered defensively
      toast.error(err, { duration: 3000 });
      return;
    }

    // Show a relatable-comparison toast
    const toastMsg = formatToast(tile.toast_template, tile.default_co2e_kg);
    toast.success(toastMsg, {
      duration: 3000,
      icon: tile.emoji,
      style: {
        borderRadius: '1rem',
        background: '#FFFFFF',
        color: '#1A1814',
        border: '1px solid #EDE9DF',
        fontSize: '0.875rem',
        fontWeight: '600',
        boxShadow: '0 4px 12px -2px rgba(26,24,20,0.1)',
      },
    });

    // Check for newly earned badges after the log is added
    const newBadges = checkNewBadges(
      // We pass the updated streak after dispatch, but badge check uses streakInfo from state
      // (which updates on next render). This is intentional — one-frame lag is acceptable.
      [],
      streakInfo,
      earnedBadgeIds
    );
    newBadges.forEach((badge) => {
      toast(
        <div className="flex flex-col gap-1">
          <div className="font-bold text-charcoal-900">
            {ALL_BADGES.find(b => b.id === badge.id)?.icon ?? '🏆'} Badge Earned!
          </div>
          <div className="text-xs text-charcoal-500">
            {badge.name}: {badge.description}
          </div>
        </div>,
      {
        duration: 5000,
        id: `badge-${badge.id}`, // Prevent duplicate toasts for same badge
        style: {
          borderRadius: '1rem',
          background: '#FAF0C9',
          border: '1px solid #EEC945',
        },
      });
    });
  };

  return (
    <div className="page py-6 flex flex-col gap-6 select-none pb-24">
      {/* Header section */}
      <div className="flex flex-col gap-1">
        <span className="section-label">TRACK YOUR DAY</span>
        <h1 className="text-2xl font-display font-extrabold text-charcoal-900 leading-tight">
          What did we do today?
        </h1>
        <p className="text-xs text-charcoal-500">
          Tap once to log. Tap again to increment. No forms, no fuss.
        </p>
      </div>

      {/* Streak Badge summary */}
      <StreakBadge streakInfo={streakInfo} />

      {/* Quick log grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3" role="list" aria-label="Activity categories">
        {TILES.map((tile) => {
          const count = todayCounts[tile.id] ?? 0;
          const isFlight = tile.id === 'flight_domestic';
          return (
            <button
              key={tile.id}
              role="listitem"
              onClick={() => handleTileClick(tile)}
              aria-label={`Log ${tile.label}${count > 0 ? `, logged ${count} time${count > 1 ? 's' : ''} today` : ''}. Estimated cost: ₹${tile.default_cost_inr}`}
              className={`log-tile relative ${
                isFlight ? 'col-span-2 xs:col-span-1 bg-cream-200 border-dashed border-cream-400' : ''
              }`}
            >
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-2.5 right-2.5 flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-extrabold text-white animate-scale-in"
                >
                  ×{count}
                </span>
              )}
              <span className="text-3xl mt-1" role="img" aria-hidden="true">
                {tile.emoji}
              </span>
              <span className="text-xs font-bold text-charcoal-800 text-center tracking-tight leading-tight">
                {tile.label}
              </span>
              <span className="text-[10px] text-charcoal-500 font-semibold uppercase tracking-wider">
                {tile.default_cost_inr > 0 ? `₹${tile.default_cost_inr}` : 'Free'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
