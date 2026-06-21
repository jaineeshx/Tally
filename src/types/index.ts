// ============================================================
// Tally — Shared TypeScript Types
// All interfaces documented with JSDoc for tooling clarity.
// ============================================================

/**
 * Valid commute modes used during onboarding and baseline
 * calculation. Covers the dominant urban transport options in
 * Indian cities.
 */
export type CommuteMode =
  | 'walk_cycle'
  | 'bus'
  | 'metro'
  | 'two_wheeler'
  | 'car_solo'
  | 'car_shared_2';

/**
 * Household size bracket used to scale home-energy baselines.
 * Maps to a multiplier in `computeBaselineWeekly`.
 */
export type HouseholdSize = '1' | '2-3' | '4+';

/**
 * Top-level category for a logged activity.
 * Drives chart grouping and category breakdown bars.
 */
export type LogCategory = 'transport' | 'food' | 'home' | 'shopping';

/**
 * Specific activity sub-type within a category.
 * Each sub-type has a corresponding entry in `emissionFactors.json`
 * and a tile definition in `categories.ts`.
 */
export type LogSubcategory =
  // transport
  | 'bus'
  | 'metro'
  | 'walk_cycle'
  | 'car_solo'
  | 'car_shared_2'
  | 'two_wheeler'
  | 'flight_domestic'
  // food
  | 'meat_meal'
  | 'veg_meal'
  | 'food_delivery_avg'
  // home
  | 'electricity_unit'
  | 'laundry_load'
  | 'ac_hour'
  // shopping
  | 'online_order_avg';

/**
 * User profile created during onboarding.
 * Stored in localStorage and synced to Supabase `profiles` table.
 */
export interface UserProfile {
  /** Supabase user UUID — undefined before auth */
  readonly id?: string;
  /** City name, free-text, used for display only */
  city: string;
  /** Dominant daily commute mode — drives the baseline calculation */
  commute_mode: CommuteMode;
  /** Household size bracket — scales home-energy baseline */
  household_size: HouseholdSize;
  /** Optional display name for leaderboard — can be empty string */
  display_name?: string;
  /** Pre-computed weekly CO₂e baseline in kg — from `computeBaselineWeekly` */
  baseline_co2e_week?: number;
}

/**
 * A single logged activity entry.
 * Written to localStorage on every tap; synced to Supabase
 * asynchronously when authenticated and online.
 */
export interface LogEntry {
  /** Client-generated UUID (`crypto.randomUUID()`) */
  readonly id?: string;
  /** Supabase user UUID — undefined for unauthenticated users */
  readonly user_id?: string;
  /** Top-level category */
  category: LogCategory;
  /** Specific activity */
  subcategory: LogSubcategory;
  /** Kg CO₂ equivalent — sourced from `emissionFactors.json` */
  co2e_kg: number;
  /** Estimated monetary cost in Indian Rupees (INR) */
  cost_estimate_inr: number;
  /** ISO 8601 timestamp of when the log was created (local time) */
  logged_at: string;
  /** False until successfully written to Supabase */
  synced?: boolean;
}

/**
 * Aggregated footprint totals for a set of log entries.
 * Returned by `calculateFootprint()`.
 */
export interface FootprintTotals {
  /** Sum of all `co2e_kg` values, rounded to 3 dp */
  total_co2e_kg: number;
  /** Per-category sub-totals, always contains all four keys */
  by_category: Record<LogCategory, number>;
  /** Number of log entries included in the calculation */
  log_count: number;
}

/**
 * Relatable real-world comparisons for a given CO₂e amount.
 * Returned by `toComparisons()`. Used on the Dashboard to make
 * abstract kg weights feel tangible.
 */
export interface RelatableComparison {
  /** Equivalent km driven in an average petrol car */
  km_driven: number;
  /** Equivalent number of smartphone charges (India grid intensity) */
  phone_charges: number;
  /** Equivalent months of carbon absorption by one mature tree */
  tree_months: number;
}

/**
 * A single personalised recommendation produced by `getRecommendations()`.
 * Shows both monetary and CO₂ savings to appeal to non-environmentally
 * motivated users.
 */
export interface Recommendation {
  /** Stable identifier — used to de-duplicate and persist dismissals */
  id: string;
  /** Short action title (≤ 40 chars) */
  title: string;
  /** Contextualised explanation referencing the user's own log counts */
  description: string;
  /** Estimated weekly money saving in INR */
  money_saved_inr_week: number;
  /** Estimated weekly CO₂ saving in kg */
  co2_saved_kg_week: number;
  /** Sort key — lower number = higher priority */
  priority: number;
  /** The subcategory that triggered this rule */
  trigger_subcategory: LogSubcategory;
}

/**
 * Current and longest consecutive-day logging streaks.
 * Calculated by `calculateStreak()` and stored in `AppContext`.
 */
export interface StreakInfo {
  /** Number of consecutive calendar days ending today or yesterday */
  current_streak: number;
  /** All-time longest streak */
  longest_streak: number;
  /** YYYY-MM-DD string of the most recent logged day, or null */
  last_log_date: string | null;
}

/**
 * A gamification badge that can be awarded to the user.
 * Badges are defined in `ALL_BADGES` in `streaks.ts`.
 */
export interface Badge {
  /** Stable identifier — stored in `earnedBadgeIds` */
  id: string;
  /** Short display name */
  name: string;
  /** One-sentence description of the achievement */
  description: string;
  /** Emoji icon — deliberately non-eco (no leaf/tree icons) */
  icon: string;
  /** ISO 8601 timestamp of when the badge was earned — optional */
  earned_at?: string;
}

/**
 * A single row in the weekly leaderboard.
 * Only the reduction percentage is shared — no raw CO₂ data,
 * protecting user privacy.
 */
export interface LeaderboardEntry {
  /** Supabase user UUID (opaque) */
  user_id: string;
  /** Anonymised display name */
  display_name: string;
  /** City for localised context */
  city: string;
  /** Percentage reduction vs personal baseline (0–100) */
  reduction_pct: number;
  /** Rank position (1 = best) */
  rank: number;
}

/**
 * Definition for a quick-log tile on the Home screen.
 * Each tile maps 1:1 to a `LogSubcategory`.
 */
export interface TileDefinition {
  /** Identifies both the tile and the subcategory to log */
  id: LogSubcategory;
  /** User-visible label (e.g. "Bus Ride", "Meat Meal") */
  label: string;
  /** Parent category */
  category: LogCategory;
  /** Emoji displayed on the tile */
  emoji: string;
  /**
   * Toast template string. Supports tokens:
   * `{phone_charges}`, `{km_driven}`, `{tree_months}`
   */
  toast_template: string;
  /** Default CO₂e in kg — from `emissionFactors.json` */
  default_co2e_kg: number;
  /** Default cost estimate in INR */
  default_cost_inr: number;
}
