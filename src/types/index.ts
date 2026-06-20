// ============================================================
// Tally — Shared TypeScript Types
// ============================================================

export type CommuteMode =
  | 'walk_cycle'
  | 'bus'
  | 'metro'
  | 'two_wheeler'
  | 'car_solo'
  | 'car_shared_2';

export type HouseholdSize = '1' | '2-3' | '4+';

export type LogCategory = 'transport' | 'food' | 'home' | 'shopping';

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

export interface UserProfile {
  id?: string;
  city: string;
  commute_mode: CommuteMode;
  household_size: HouseholdSize;
  display_name?: string;
  baseline_co2e_week?: number;
}

export interface LogEntry {
  id?: string;
  user_id?: string;
  category: LogCategory;
  subcategory: LogSubcategory;
  co2e_kg: number;
  cost_estimate_inr: number;
  logged_at: string; // ISO 8601
  synced?: boolean;   // local-first: false until synced to Supabase
}

export interface FootprintTotals {
  total_co2e_kg: number;
  by_category: Record<LogCategory, number>;
  log_count: number;
}

export interface RelatableComparison {
  km_driven: number;
  phone_charges: number;
  tree_months: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  money_saved_inr_week: number;
  co2_saved_kg_week: number;
  priority: number; // lower = higher priority
  trigger_subcategory: LogSubcategory;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null; // YYYY-MM-DD
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji — no eco icons, use neutral/fun emojis
  earned_at?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  city: string;
  reduction_pct: number;
  rank: number;
}

export interface TileDefinition {
  id: LogSubcategory;
  label: string;
  category: LogCategory;
  emoji: string;
  toast_template: string; // e.g. "Logged. That's like {comparison}"
  default_co2e_kg: number;
  default_cost_inr: number;
}
