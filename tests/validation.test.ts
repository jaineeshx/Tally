// ============================================================
// validation.test.ts
// Comprehensive tests for the validation + sanitisation module.
// Every public function and each error branch is covered.
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  validateLog,
  validateEmail,
  sanitiseDisplayName,
  MAX_LOGS,
  MAX_CO2E_PER_LOG,
  MAX_COST_INR,
  MAX_DISPLAY_NAME_LENGTH,
} from '../src/lib/validation';

// ── validateLog ─────────────────────────────────────────────
describe('validateLog — valid inputs', () => {
  it('accepts a valid transport log', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'bus',
      co2e_kg: 0.84,
      cost_estimate_inr: 20,
    });
    expect(result.ok).toBe(true);
    expect(result.value?.category).toBe('transport');
    expect(result.value?.subcategory).toBe('bus');
  });

  it('accepts zero co2e (walk_cycle)', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'walk_cycle',
      co2e_kg: 0,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(true);
    expect(result.value?.co2e_kg).toBe(0);
  });

  it('accepts all valid categories', () => {
    const categories: [string, string][] = [
      ['transport', 'metro'],
      ['food', 'veg_meal'],
      ['home', 'ac_hour'],
      ['shopping', 'online_order_avg'],
    ];
    for (const [cat, sub] of categories) {
      const result = validateLog({ category: cat, subcategory: sub, co2e_kg: 1, cost_estimate_inr: 10 });
      expect(result.ok, `Expected ok for ${cat}/${sub}`).toBe(true);
    }
  });

  it('normalises co2e to at most 4 decimal places', () => {
    const result = validateLog({
      category: 'food',
      subcategory: 'veg_meal',
      co2e_kg: 0.123456789,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(true);
    // 4 dp max: 0.1235
    expect(result.value?.co2e_kg).toBeCloseTo(0.1235, 4);
    expect(String(result.value?.co2e_kg).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4);
  });

  it('normalises cost to at most 2 decimal places', () => {
    const result = validateLog({
      category: 'food',
      subcategory: 'meat_meal',
      co2e_kg: 3.3,
      cost_estimate_inr: 149.999,
    });
    expect(result.ok).toBe(true);
    expect(result.value?.cost_estimate_inr).toBeCloseTo(150, 2);
  });

  it('accepts co2e right at the boundary (MAX_CO2E_PER_LOG)', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'flight_domestic',
      co2e_kg: MAX_CO2E_PER_LOG,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(true);
  });
});

describe('validateLog — rejection cases', () => {
  it('rejects unknown category', () => {
    const result = validateLog({
      category: 'invalid_cat',
      subcategory: 'bus',
      co2e_kg: 0.5,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown category/i);
  });

  it('rejects unknown subcategory', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'teleportation',
      co2e_kg: 0.5,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown subcategory/i);
  });

  it('rejects negative co2e', () => {
    const result = validateLog({
      category: 'food',
      subcategory: 'veg_meal',
      co2e_kg: -0.1,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/non-negative/i);
  });

  it('rejects NaN co2e', () => {
    const result = validateLog({
      category: 'food',
      subcategory: 'meat_meal',
      co2e_kg: NaN,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects Infinity co2e', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'car_solo',
      co2e_kg: Infinity,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects co2e exceeding MAX_CO2E_PER_LOG', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'flight_domestic',
      co2e_kg: MAX_CO2E_PER_LOG + 1,
      cost_estimate_inr: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/maximum/i);
  });

  it('rejects negative cost', () => {
    const result = validateLog({
      category: 'food',
      subcategory: 'meat_meal',
      co2e_kg: 3.3,
      cost_estimate_inr: -1,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/non-negative/i);
  });

  it('rejects cost exceeding MAX_COST_INR', () => {
    const result = validateLog({
      category: 'transport',
      subcategory: 'flight_domestic',
      co2e_kg: 1000,
      cost_estimate_inr: MAX_COST_INR + 1,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/maximum/i);
  });
});

// ── validateEmail ────────────────────────────────────────────
describe('validateEmail — valid inputs', () => {
  it('accepts a standard email', () => {
    const result = validateEmail('user@example.com');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('user@example.com');
  });

  it('trims whitespace and lowercases', () => {
    const result = validateEmail('  User@Example.COM  ');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('user@example.com');
  });

  it('accepts subdomains', () => {
    const result = validateEmail('me@mail.company.co.in');
    expect(result.ok).toBe(true);
  });
});

describe('validateEmail — rejection cases', () => {
  it('rejects empty string', () => {
    const result = validateEmail('');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('rejects whitespace-only string', () => {
    const result = validateEmail('   ');
    expect(result.ok).toBe(false);
  });

  it('rejects missing @', () => {
    const result = validateEmail('notanemail.com');
    expect(result.ok).toBe(false);
  });

  it('rejects missing TLD', () => {
    const result = validateEmail('user@domain');
    expect(result.ok).toBe(false);
  });

  it('rejects email that is too long', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = validateEmail(longEmail);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too long/i);
  });
});

// ── sanitiseDisplayName ──────────────────────────────────────
describe('sanitiseDisplayName', () => {
  it('returns empty string for empty input (field is optional)', () => {
    const result = sanitiseDisplayName('');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('');
  });

  it('trims leading/trailing whitespace', () => {
    const result = sanitiseDisplayName('  Priya  ');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('Priya');
  });

  it('collapses multiple internal spaces', () => {
    const result = sanitiseDisplayName('  Ravi   Kumar  ');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('Ravi Kumar');
  });

  it('removes control characters', () => {
    const result = sanitiseDisplayName('Valid\x00Name\x1F');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('ValidName');
  });

  it('accepts Unicode characters (Indian names)', () => {
    const result = sanitiseDisplayName('अर्जुन');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('अर्जुन');
  });

  it('rejects names exceeding MAX_DISPLAY_NAME_LENGTH', () => {
    const longName = 'A'.repeat(MAX_DISPLAY_NAME_LENGTH + 1);
    const result = sanitiseDisplayName(longName);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/characters or fewer/i);
  });

  it('accepts name exactly at MAX_DISPLAY_NAME_LENGTH', () => {
    const exactName = 'A'.repeat(MAX_DISPLAY_NAME_LENGTH);
    const result = sanitiseDisplayName(exactName);
    expect(result.ok).toBe(true);
  });
});

// ── Constants sanity checks ──────────────────────────────────
describe('exported constants', () => {
  it('MAX_LOGS is a reasonable positive integer', () => {
    expect(MAX_LOGS).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_LOGS)).toBe(true);
  });

  it('MAX_CO2E_PER_LOG is large enough for a transatlantic flight', () => {
    // Transatlantic round-trip ≈ 3,400 kg CO2e — must fit
    expect(MAX_CO2E_PER_LOG).toBeGreaterThanOrEqual(3400);
  });

  it('MAX_COST_INR is large enough for a business-class flight', () => {
    // Business class Mumbai-London ≈ ₹3,50,000 — must fit
    expect(MAX_COST_INR).toBeGreaterThanOrEqual(350_000);
  });
});
