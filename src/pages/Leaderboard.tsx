import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LeaderboardList from '../components/gamification/Leaderboard';
import { ALL_BADGES } from '../lib/streaks';
import { Trophy, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const { earnedBadgeIds } = useApp();
  const [tab, setTab] = useState<'leaderboard' | 'badges'>('leaderboard');

  return (
    <div className="page py-6 flex flex-col gap-6 pb-24 animate-fade-in">
      {/* Title & Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="section-label">GAMIFICATION</span>
          <h1 className="text-2xl font-display font-extrabold text-charcoal-900 leading-tight">
            Ranks & Achievements
          </h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-cream-200 p-1 rounded-xl border border-cream-300">
          <button
            onClick={() => setTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${
              tab === 'leaderboard'
                ? 'bg-white text-gold-500 shadow-warm-sm'
                : 'text-charcoal-400 hover:text-charcoal-600'
            }`}
          >
            <Trophy size={12} /> Leaderboard
          </button>
          <button
            onClick={() => setTab('badges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${
              tab === 'badges'
                ? 'bg-white text-gold-500 shadow-warm-sm'
                : 'text-charcoal-400 hover:text-charcoal-600'
            }`}
          >
            <Award size={12} /> Badges
          </button>
        </div>
      </div>

      {tab === 'leaderboard' ? (
        <div className="flex flex-col gap-4 animate-scale-in">
          <div className="card-flat p-4 border-gold-200 bg-gold-50/20">
            <h2 className="text-sm font-bold text-charcoal-800 mb-1">
              About the Leaderboard
            </h2>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              We rank users based on their **weekly CO₂e reduction percentage** relative to their own commute and household baseline. This avoids penalizing people with longer natural commutes and rewards smart changes!
            </p>
          </div>

          <LeaderboardList />
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-scale-in">
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`card p-4 flex flex-col items-center justify-center text-center gap-2 border transition-all ${
                    isEarned
                      ? 'border-gold-300 bg-gold-50/20'
                      : 'border-cream-300 bg-white/40 opacity-50 select-none'
                  }`}
                >
                  <span
                    className={`text-4xl ${isEarned ? 'animate-bounce-gentle' : 'filter grayscale'}`}
                    role="img"
                    aria-label={badge.name}
                  >
                    {badge.icon}
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold text-charcoal-800 leading-tight">
                      {badge.name}
                    </h3>
                    <p className="text-[10px] text-charcoal-500 font-semibold leading-tight mt-1">
                      {badge.description}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      isEarned ? 'bg-gold-500 text-white' : 'bg-cream-200 text-charcoal-400'
                    }`}
                  >
                    {isEarned ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
