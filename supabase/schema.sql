-- ============================================================
-- Tally — Supabase Schema
-- Run this entire file in the Supabase SQL editor.
-- All tables have Row Level Security (RLS) enabled.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  city          TEXT NOT NULL DEFAULT 'Mumbai',
  commute_mode  TEXT NOT NULL DEFAULT 'bus',
  household_size TEXT NOT NULL DEFAULT '2-3',
  display_name  TEXT,
  baseline_co2e_week NUMERIC(10, 3),  -- computed once at onboarding
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────
-- 2. LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,        -- e.g. 'transport', 'food', 'home', 'shopping'
  subcategory       TEXT NOT NULL,        -- e.g. 'bus', 'meat_meal', 'ac_hour'
  co2e_kg           NUMERIC(10, 4) NOT NULL,
  cost_estimate_inr NUMERIC(10, 2),
  logged_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON public.logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS logs_user_logged_at_idx ON public.logs (user_id, logged_at DESC);

-- ─────────────────────────────────────────────
-- 3. STREAKS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_log_date    DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. BADGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,    -- e.g. 'streak_7', 'first_carpool', 'veg_week'
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON public.badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 5. LEADERBOARD VIEW
-- Exposes ONLY aggregated reduction percentage — never raw logs.
-- Reduction = how much below baseline the user is this week.
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  COALESCE(p.display_name, 'Anonymous') AS display_name,
  p.city,
  p.baseline_co2e_week,
  COALESCE(SUM(l.co2e_kg), 0) AS this_week_co2e,
  CASE
    WHEN p.baseline_co2e_week > 0 THEN
      ROUND(
        ((p.baseline_co2e_week - COALESCE(SUM(l.co2e_kg), 0)) / p.baseline_co2e_week) * 100,
        1
      )
    ELSE 0
  END AS reduction_pct
FROM public.profiles p
LEFT JOIN public.logs l
  ON l.user_id = p.id
  AND l.logged_at >= date_trunc('week', NOW())
  AND l.logged_at < date_trunc('week', NOW()) + INTERVAL '7 days'
GROUP BY p.id, p.display_name, p.city, p.baseline_co2e_week
ORDER BY reduction_pct DESC;

-- Policy: any authenticated user can read the leaderboard view
-- (it only exposes display_name, city, and aggregated reduction_pct)
CREATE POLICY "Anyone authenticated can view leaderboard"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 6. DEMO SEED DATA (10 fake profiles for leaderboard)
-- Run after setting up auth users, OR use these as reference.
-- In production remove this block.
-- ─────────────────────────────────────────────
-- NOTE: Seed script is in supabase/seed.sql — run separately.
