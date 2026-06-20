// ============================================================
// validation.ts
// Input validation and sanitisation for all user-supplied data.
// Pure functions — no DOM, no network, no side effects.
// Used both client-side and as the authoritative rule set for
// tests. Nothing enters the log store without passing here.
// ============================================================

import type { LogCategory, LogSubcategory } from '../types';

// ── Constants ───────────────────────────────────────────────
/** Maximum logs we retain in localStorage to avoid unbounded growth. */
export const MAX_LOGS = 500;

/** Valid subcategory values — kept in sync with LogSubcategory union. */
const VALID_SUBCATEGORIES = new Set<string>([
  'bus', 'metro', 'walk_cycle', 'car_solo', 'car_shared_2',
  'two_wheeler', 'flight_domestic',
  'meat_meal', 'veg_meal', 'food_delivery_avg',
  'electricity_unit', 'laundry_load', 'ac_hour',
  'online_order_avg',
]);

/** Valid category values. */
const VALID_CATEGORIES = new Set<string>([
  'transport', 'food', 'home', 'shopping',
]);

/** Maximum co2e_kg value for a single log (a transatlantic flight ≈ 2,000 kg). */
export const MAX_CO2E_PER_LOG = 5000;

/** Maximum cost in INR for a single log (business class flight). */
export const MAX_COST_INR = 500_000;

/** Maximum display name length. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/** Maximum email length (RFC 5321). */
export const MAX_EMAIL_LENGTH = 254;

// ── Result type ─────────────────────────────────────────────
export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

// ── Log validation ──────────────────────────────────────────
export interface RawLogInput {
  category: string;
  subcategory: string;
  co2e_kg: number;
  cost_estimate_inr: number;
}

/**
 * Validate and sanitise a log entry before storing it.
 * Returns { ok: true, value: sanitised } or { ok: false, error: message }.
 */
export function validateLog(input: RawLogInput): ValidationResult<{
  category: LogCategory;
  subcategory: LogSubcategory;
  co2e_kg: number;
  cost_estimate_inr: number;
}> {
  if (!VALID_CATEGORIES.has(input.category)) {
    return { ok: false, error: `Unknown category: ${String(input.category).slice(0, 30)}` };
  }
  if (!VALID_SUBCATEGORIES.has(input.subcategory)) {
    return { ok: false, error: `Unknown subcategory: ${String(input.subcategory).slice(0, 30)}` };
  }

  const co2e = Number(input.co2e_kg);
  if (!isFinite(co2e) || co2e < 0) {
    return { ok: false, error: 'co2e_kg must be a non-negative finite number' };
  }
  if (co2e > MAX_CO2E_PER_LOG) {
    return { ok: false, error: `co2e_kg exceeds maximum allowed value (${MAX_CO2E_PER_LOG})` };
  }

  const cost = Number(input.cost_estimate_inr);
  if (!isFinite(cost) || cost < 0) {
    return { ok: false, error: 'cost_estimate_inr must be a non-negative finite number' };
  }
  if (cost > MAX_COST_INR) {
    return { ok: false, error: `cost_estimate_inr exceeds maximum allowed value (${MAX_COST_INR})` };
  }

  return {
    ok: true,
    value: {
      category: input.category as LogCategory,
      subcategory: input.subcategory as LogSubcategory,
      co2e_kg: Math.round(co2e * 10_000) / 10_000, // 4 decimal places max
      cost_estimate_inr: Math.round(cost * 100) / 100,
    },
  };
}

// ── Email validation ────────────────────────────────────────
/**
 * Basic email validation for the magic-link auth form.
 * Does NOT call any external service — purely structural.
 */
export function validateEmail(email: string): ValidationResult<string> {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Email is required' };
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { ok: false, error: 'Email is too long' };
  }
  // RFC 5322-like pattern — deliberately not over-engineered
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRe.test(trimmed)) {
    return { ok: false, error: 'Please enter a valid email address' };
  }
  return { ok: true, value: trimmed };
}

// ── Display-name sanitisation ───────────────────────────────
/**
 * Sanitise user-supplied display names.
 * Strips leading/trailing whitespace, collapses internal whitespace,
 * and enforces length limit.
 */
export function sanitiseDisplayName(name: string): ValidationResult<string> {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) {
    return { ok: true, value: '' }; // optional field
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer`,
    };
  }
  // Remove control characters (keeping printable Unicode)
  const safe = trimmed.replace(/[\x00-\x1F\x7F]/g, '');
  return { ok: true, value: safe };
}
