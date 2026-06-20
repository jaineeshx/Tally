import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { computeBaselineWeekly } from '../lib/calculateFootprint';
import factors from '../data/emissionFactors.json';
import RecapCard from '../components/gamification/RecapCard';
import { supabase } from '../lib/supabaseClient';
import type { CommuteMode, HouseholdSize } from '../types';
import toast, { Toaster } from 'react-hot-toast';
import { Save, LogIn, LogOut, CheckCircle, RefreshCw } from 'lucide-react';

export default function Profile() {
  const {
    profile,
    saveProfile,
    isAuthenticated,
    userId,
    signInWithMagicLink,
    signOut,
  } = useApp();

  // Profile Form States
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [city, setCity] = useState(profile?.city || 'Mumbai');
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(profile?.commute_mode || 'bus');
  const [householdSize, setHouseholdSize] = useState<HouseholdSize>(profile?.household_size || '2-3');

  // Auth Form State
  const [email, setEmail] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Sync user details if authenticated
  useEffect(() => {
    if (isAuthenticated && supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null);
      });
    } else {
      setUserEmail(null);
    }
  }, [isAuthenticated]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Recompute baseline since commute or household might have changed
    const newBaseline = computeBaselineWeekly({
      commute_mode: commuteMode,
      household_size: householdSize,
    });

    saveProfile({
      display_name: displayName,
      city,
      commute_mode: commuteMode,
      household_size: householdSize,
      baseline_co2e_week: newBaseline,
    });

    toast.success('Profile updated successfully!', {
      style: {
        borderRadius: '1rem',
        background: '#FFFFFF',
        color: '#1A1814',
        border: '1px solid #EDE9DF',
        fontSize: '0.875rem',
        fontWeight: '600',
      },
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingAuth(true);

    const { error } = await signInWithMagicLink(email);
    setLoadingAuth(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Magic link sent! Check your inbox.');
      setEmail('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
  };

  const commuteOptions: { id: CommuteMode; label: string }[] = [
    { id: 'walk_cycle', label: 'Walk / Cycle' },
    { id: 'bus', label: 'Bus / Auto' },
    { id: 'metro', label: 'Train / Metro' },
    { id: 'two_wheeler', label: 'Two-Wheeler' },
    { id: 'car_solo', label: 'Drive Solo' },
    { id: 'car_shared_2', label: 'Carpool / Shared' },
  ];

  return (
    <div className="page py-6 flex flex-col gap-6 pb-24 animate-fade-in">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <span className="section-label">ACCOUNT</span>
        <h1 className="text-2xl font-display font-extrabold text-charcoal-900 leading-tight">
          Profile & Sync
        </h1>
      </div>

      {/* Supabase Magic Link Auth Gate */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
            Cloud Sync & Leaderboard
          </h2>
          {isAuthenticated ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-sage-50 text-sage-500 text-[10px] font-extrabold uppercase">
              <CheckCircle size={10} /> Saved to Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cream-200 text-charcoal-500 text-[10px] font-extrabold uppercase">
              Local Only
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-charcoal-500 leading-relaxed">
              You are signed in as <strong className="text-charcoal-800">{userEmail}</strong>. Your daily logs and streaks are synced automatically.
            </p>
            <button onClick={handleSignOut} className="btn-secondary py-3 text-xs flex items-center justify-center gap-2">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <p className="text-xs text-charcoal-500 leading-relaxed font-medium">
              Want your streaks to persist across devices and appear on the Leaderboard? Enter your email to get a magic link login. No passwords needed.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-cream-400 bg-cream-50 focus:border-gold-500 focus:outline-none text-xs text-charcoal-800 font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loadingAuth}
              className="btn-primary py-3 text-xs flex items-center justify-center gap-2"
            >
              {loadingAuth ? <RefreshCw size={14} className="animate-spin" /> : <LogIn size={14} />}
              {loadingAuth ? 'Sending...' : 'Get Magic Link'}
            </button>
          </form>
        )}
      </div>

      {/* Edit Profile Form */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
          Daily Configurations
        </h2>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display-name" className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wide">
              LEADERBOARD DISPLAY NAME
            </label>
            <input
              id="display-name"
              type="text"
              placeholder="e.g. Aarav M."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-cream-400 bg-cream-50 focus:border-gold-500 focus:outline-none text-xs text-charcoal-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-city" className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wide">
                CITY
              </label>
              <select
                id="profile-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-cream-400 bg-cream-50 focus:border-gold-500 focus:outline-none text-xs text-charcoal-800 font-medium"
              >
                {factors.indian_cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-commute" className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wide">
                COMMUTE MODE
              </label>
              <select
                id="profile-commute"
                value={commuteMode}
                onChange={(e) => setCommuteMode(e.target.value as CommuteMode)}
                className="w-full px-3 py-3 rounded-xl border border-cream-400 bg-cream-50 focus:border-gold-500 focus:outline-none text-xs text-charcoal-800 font-medium"
              >
                {commuteOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wide">
              HOUSEHOLD SIZE
            </label>
            <div className="flex gap-2 bg-cream-200 p-1 rounded-xl border border-cream-300">
              {(['1', '2-3', '4+'] as HouseholdSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setHouseholdSize(size)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    householdSize === size
                      ? 'bg-white text-gold-500 shadow-warm-sm'
                      : 'text-charcoal-400 hover:text-charcoal-600'
                  }`}
                >
                  {size === '1' ? 'Solo' : size === '2-3' ? '2-3 Flat' : '4+ Large'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary py-3 text-xs flex items-center justify-center gap-2 mt-2">
            <Save size={14} /> Save Profile Settings
          </button>
        </form>
      </div>

      {/* Recap Card Section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-bold text-charcoal-600 uppercase tracking-wider px-1">
          Weekly Recap Card
        </h2>
        <RecapCard />
      </div>
    </div>
  );
}
