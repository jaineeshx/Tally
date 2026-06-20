// ============================================================
// AppContext.tsx — Global state: profile, logs, streaks, auth
// Local-first: reads/writes localStorage, syncs to Supabase
// when authenticated.
// ============================================================
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserProfile, LogEntry, StreakInfo } from '../types';
import { calculateStreak } from '../lib/streaks';
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── State ──────────────────────────────────────────────────
interface AppState {
  profile: UserProfile | null;
  logs: LogEntry[];
  streakInfo: StreakInfo;
  earnedBadgeIds: string[];
  userId: string | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  onboardingComplete: boolean;
}

// ── Actions ────────────────────────────────────────────────
type Action =
  | { type: 'SET_PROFILE'; profile: UserProfile }
  | { type: 'ADD_LOG'; log: LogEntry }
  | { type: 'SET_LOGS'; logs: LogEntry[] }
  | { type: 'SET_AUTH'; userId: string | null }
  | { type: 'SET_SYNCING'; syncing: boolean }
  | { type: 'EARN_BADGE'; badgeId: string }
  | { type: 'SET_BADGES'; ids: string[] }
  | { type: 'COMPLETE_ONBOARDING' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'ADD_LOG': {
      const logs = [action.log, ...state.logs];
      return {
        ...state,
        logs,
        streakInfo: calculateStreak(logs),
      };
    }
    case 'SET_LOGS':
      return {
        ...state,
        logs: action.logs,
        streakInfo: calculateStreak(action.logs),
      };
    case 'SET_AUTH':
      return { ...state, userId: action.userId, isAuthenticated: action.userId !== null };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.syncing };
    case 'EARN_BADGE':
      if (state.earnedBadgeIds.includes(action.badgeId)) return state;
      return { ...state, earnedBadgeIds: [...state.earnedBadgeIds, action.badgeId] };
    case 'SET_BADGES':
      return { ...state, earnedBadgeIds: action.ids };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    default:
      return state;
  }
}

// ── Local storage keys ─────────────────────────────────────
const LS_PROFILE = 'tally_profile';
const LS_LOGS = 'tally_logs';
const LS_BADGES = 'tally_badges';
const LS_ONBOARDING = 'tally_onboarding_done';

function loadFromLS(): Partial<AppState> {
  try {
    const profile = localStorage.getItem(LS_PROFILE);
    const logs = localStorage.getItem(LS_LOGS);
    const badges = localStorage.getItem(LS_BADGES);
    const onboarding = localStorage.getItem(LS_ONBOARDING);
    const parsedLogs: LogEntry[] = logs ? JSON.parse(logs) : [];
    return {
      profile: profile ? JSON.parse(profile) : null,
      logs: parsedLogs,
      streakInfo: calculateStreak(parsedLogs),
      earnedBadgeIds: badges ? JSON.parse(badges) : [],
      onboardingComplete: onboarding === 'true',
    };
  } catch {
    return {};
  }
}

// ── Context ────────────────────────────────────────────────
interface AppContextValue extends AppState {
  saveProfile: (profile: UserProfile) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'logged_at' | 'synced'>) => void;
  completeOnboarding: () => void;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = loadFromLS();
  const [state, dispatch] = useReducer(reducer, {
    profile: null,
    logs: [],
    streakInfo: { current_streak: 0, longest_streak: 0, last_log_date: null },
    earnedBadgeIds: [],
    userId: null,
    isAuthenticated: false,
    isSyncing: false,
    onboardingComplete: false,
    ...initial,
  });

  // ── Persist to localStorage on every state change ─────────
  useEffect(() => {
    if (state.profile) localStorage.setItem(LS_PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(LS_LOGS, JSON.stringify(state.logs));
    localStorage.setItem(LS_BADGES, JSON.stringify(state.earnedBadgeIds));
    localStorage.setItem(LS_ONBOARDING, String(state.onboardingComplete));
  }, [state.profile, state.logs, state.earnedBadgeIds, state.onboardingComplete]);

  // ── Supabase auth listener ─────────────────────────────────
  useEffect(() => {
    if (!isSupabaseAvailable() || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_AUTH', userId: session?.user.id ?? null });
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sync unsynced logs to Supabase when authenticated ─────
  useEffect(() => {
    if (!state.isAuthenticated || !supabase) return;
    const unsynced = state.logs.filter((l) => !l.synced && l.user_id === undefined);
    if (unsynced.length === 0) return;

    dispatch({ type: 'SET_SYNCING', syncing: true });
    supabase
      .from('logs')
      .insert(
        unsynced.map((l) => ({
          user_id: state.userId,
          category: l.category,
          subcategory: l.subcategory,
          co2e_kg: l.co2e_kg,
          cost_estimate_inr: l.cost_estimate_inr,
          logged_at: l.logged_at,
        }))
      )
      .then(({ error }) => {
        if (!error) {
          dispatch({
            type: 'SET_LOGS',
            logs: state.logs.map((l) => ({ ...l, synced: true })),
          });
        }
        dispatch({ type: 'SET_SYNCING', syncing: false });
      });
  }, [state.isAuthenticated, state.userId]); // eslint-disable-line

  // ── Actions ────────────────────────────────────────────────
  const saveProfile = useCallback((profile: UserProfile) => {
    dispatch({ type: 'SET_PROFILE', profile });
    if (supabase && state.userId) {
      supabase.from('profiles').upsert({
        id: state.userId,
        ...profile,
        baseline_co2e_week: profile.baseline_co2e_week,
      });
    }
  }, [state.userId]);

  const addLog = useCallback((logData: Omit<LogEntry, 'id' | 'logged_at' | 'synced'>) => {
    const log: LogEntry = {
      ...logData,
      id: crypto.randomUUID(),
      logged_at: new Date().toISOString(),
      synced: false,
    };
    dispatch({ type: 'ADD_LOG', log });

    // Async sync to Supabase if authenticated
    if (supabase && state.userId) {
      supabase.from('logs').insert({
        user_id: state.userId,
        category: log.category,
        subcategory: log.subcategory,
        co2e_kg: log.co2e_kg,
        cost_estimate_inr: log.cost_estimate_inr,
        logged_at: log.logged_at,
      }).then(({ error }) => {
        if (!error) {
          dispatch({
            type: 'SET_LOGS',
            logs: state.logs.map((l) => l.id === log.id ? { ...l, synced: true } : l),
          });
        }
      });
    }
  }, [state.userId, state.logs]);

  const completeOnboarding = useCallback(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Auth not configured' };
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    dispatch({ type: 'SET_AUTH', userId: null });
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      saveProfile,
      addLog,
      completeOnboarding,
      signInWithMagicLink,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
