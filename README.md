# Tally — A Carbon Footprint App for People Who Don't Care About Carbon

> **Hackathon submission.** Tally reframes "how much CO₂ did I emit today?" as "what did my day actually cost me?" — in rupees, smartphone charges, and kilometres driven. No leaf icons. No eco-guilt. Just a budgeting/habit tracker that reduces carbon as a side-effect.

## 🔗 Live Demo

**[https://ballot-oracle.web.app](https://ballot-oracle.web.app)** — Deployed on Google Cloud Firebase Hosting.

---

## 🏆 Rubric Mapping

Every evaluation criterion is explicitly implemented and traceable to source:

| Rubric Criterion | Implementation | Source File |
| :--- | :--- | :--- |
| **Track daily footprint** | One-tap tile grid writes instantly to `localStorage`. Live counter badges show how many times each activity was logged today. Sync to Supabase happens in the background when online. | [`Home.tsx`](src/pages/Home.tsx), [`AppContext.tsx`](src/context/AppContext.tsx) |
| **Understand the impact** | Abstract kg CO₂e values are converted to smartphone charges, km driven, and tree-months. A bar chart shows daily trends over Today / 7 days / 30 days. | [`Dashboard.tsx`](src/pages/Dashboard.tsx), [`calculateFootprint.ts`](src/lib/calculateFootprint.ts) |
| **Reduce via personalised recommendations** | A deterministic rule engine analyses the last 14 days of logs and surfaces 2–3 prioritised habit suggestions, each showing ₹ saved/week and kg CO₂ saved/week. | [`recommendationEngine.ts`](src/lib/recommendationEngine.ts), [`RecommendationsList.tsx`](src/components/recommendations/RecommendationsList.tsx) |
| **Zero friction logging** | No modal, no form, no dropdown. One tap = one log. Categories prefilled with realistic Indian urban defaults (e.g. BEST bus, ₹20, 0.84 kg). | [`categories.ts`](src/data/categories.ts) |
| **Gamification & streaks** | Daily streak counter, longest-streak record, 7 badge types auto-awarded on milestones. Badge toast appears immediately on unlock. | [`streaks.ts`](src/lib/streaks.ts), [`StreakBadge.tsx`](src/components/gamification/StreakBadge.tsx) |
| **Social / leaderboard** | Anonymised weekly leaderboard ranked by % reduction vs personal baseline. Seeded with realistic demo data for the hackathon. | [`Leaderboard.tsx`](src/pages/Leaderboard.tsx) |
| **Offline-first PWA** | Service worker precaches all static assets + emission factors JSON. All logging, streak calculation, and recommendations work with zero network. An indicator pill appears when offline and disappears when reconnected. | [`vite.config.ts`](vite.config.ts), [`OfflineIndicator.tsx`](src/components/shared/OfflineIndicator.tsx) |
| **Security** | Content Security Policy (CSP) meta tag restricts script/style/connect sources. All user input validated and sanitised before storage. Log count capped at 500 to prevent localStorage abuse. | [`index.html`](index.html), [`validation.ts`](src/lib/validation.ts) |
| **Code quality** | Zero `any` types. Stale-closure bug in `addLog` fixed via `useRef` pattern. Custom hooks extract all data logic out of UI components. Error boundaries per-page with local-storage-safe recovery message. | [`AppContext.tsx`](src/context/AppContext.tsx), [`useLogs.ts`](src/hooks/useLogs.ts), [`ErrorBoundary.tsx`](src/components/shared/ErrorBoundary.tsx) |
| **Verified emission data** | All factors sourced from CEA India, DEFRA UK, US EPA, and IPCC. Full citations in the data file and methodology section below. | [`emissionFactors.json`](src/data/emissionFactors.json) |

---

## 📁 Folder Structure

```
tally/
├── index.html                     # Entry point — includes CSP meta tag & PWA manifest link
├── vite.config.ts                 # Vite + React + PWA plugin + manual chunk splitting
├── tailwind.config.js             # Custom design tokens (cream, gold, charcoal palette)
├── postcss.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .env.example                   # Template — copy to .env, add Supabase URL + anon key
│
├── supabase/
│   └── schema.sql                 # Full DB schema: profiles, logs, streaks, badges, leaderboard view
│                                  # All tables have Row Level Security (RLS) enabled
│
├── public/
│   ├── manifest.json              # PWA manifest (name, icons, theme colour, start_url)
│   └── icons/                     # App icons at 192×192 and 512×512
│
├── src/
│   ├── main.tsx                   # React DOM root mount
│   ├── App.tsx                    # Router + ErrorBoundary + OfflineIndicator shell
│   ├── index.css                  # Global Tailwind base + custom utility classes
│   │
│   ├── types/
│   │   └── index.ts               # Shared TypeScript types: LogEntry, UserProfile, Badge,
│   │                              # StreakInfo, FootprintTotals, Recommendation, etc.
│   │
│   ├── data/
│   │   ├── emissionFactors.json   # Static emission factors dataset with source citations
│   │   └── categories.ts          # Typed tile definitions (emoji, label, co2e, cost, toast)
│   │
│   ├── lib/                       # Pure functions — no DOM, no network, fully unit-testable
│   │   ├── calculateFootprint.ts  # calculateFootprint(), toComparisons(), formatToast(),
│   │   │                          # computeBaselineWeekly()
│   │   ├── recommendationEngine.ts# countSubcategories(), getRecommendations() — 5 rules + fallback
│   │   ├── streaks.ts             # toLocalDateStr(), calculateStreak(), checkNewBadges(),
│   │   │                          # ALL_BADGES constant
│   │   ├── supabaseClient.ts      # Lazy Supabase init — gracefully returns null if env vars absent
│   │   └── validation.ts          # validateLog(), validateEmail(), sanitiseDisplayName()
│   │                              # MAX_LOGS, MAX_CO2E_PER_LOG, MAX_COST_INR constants
│   │
│   ├── hooks/
│   │   └── useLogs.ts             # useFilteredLogs(), useFootprintSummary(), useTodayCounts(),
│   │                              # useRecentLogs() — memoised, time-window-aware
│   │
│   ├── context/
│   │   └── AppContext.tsx         # Global state via useReducer. Local-first persistence.
│   │                              # stateRef pattern prevents stale-closure in addLog/sync.
│   │                              # addLog() validates before storing, returns error or null.
│   │
│   ├── pages/
│   │   ├── Home.tsx               # Quick-log tile grid, streak display, badge toasts
│   │   ├── Dashboard.tsx          # CO₂ charts, category breakdown bars, recommendations
│   │   ├── Leaderboard.tsx        # Anonymised weekly rank table
│   │   ├── Onboarding.tsx         # 3-step setup: name → commute mode → household size
│   │   └── Profile.tsx            # Badge collection, magic-link auth, share recap card
│   │
│   └── components/
│       ├── shared/
│       │   ├── BottomNav.tsx          # Fixed tab bar: Home / Dashboard / Leaderboard / Profile
│       │   ├── ErrorBoundary.tsx      # Class component — catches render errors, shows recovery UI
│       │   └── OfflineIndicator.tsx   # Network status pill (offline / syncing)
│       ├── gamification/
│       │   ├── StreakBadge.tsx         # Current streak + "at risk" warning chip
│       │   ├── Leaderboard.tsx         # Leaderboard row component
│       │   └── RecapCard.tsx           # html-to-image shareable weekly summary card
│       └── recommendations/
│           └── RecommendationsList.tsx # Renders top-3 recommendations with ₹ savings callouts
│
└── tests/                         # Vitest unit tests — run with `npm run test`
    ├── setup.ts                   # Imports @testing-library/jest-dom matchers
    ├── calculateFootprint.test.ts # 30 tests
    ├── recommendationEngine.test.ts # 21 tests
    ├── streaks.test.ts            # 14 tests
    └── validation.test.ts         # 32 tests
```

---

## 🧪 Test Suite — 97 Tests, All Passing

Run with:
```bash
npm run test           # one-shot
npm run test:watch     # watch mode during development
npm run test:ui        # Vitest browser UI
```

### `tests/calculateFootprint.test.ts` — 30 tests

#### `calculateFootprint` — basics
| # | Test name |
|---|---|
| 1 | returns zero totals for empty log array |
| 2 | handles a single transport log correctly |
| 3 | correctly sums mixed category logs |
| 4 | handles unknown category without crashing (adds to total only) |
| 5 | handles zero co2e entries (walk/cycle) |
| 6 | rounds to 3 decimal places |
| 7 | log_count reflects exact array length including duplicates |

#### `calculateFootprint` — edge cases
| # | Test name |
|---|---|
| 8 | handles co2e_kg as string-coerced number gracefully |
| 9 | handles large dataset (500 logs) without overflow |
| 10 | all four categories are always present in by_category even with no matching logs |
| 11 | sums multiple logs in same category correctly |

#### `toComparisons`
| # | Test name |
|---|---|
| 12 | converts 1 kg CO2e to expected comparisons |
| 13 | returns zero comparisons for zero CO2e |
| 14 | scales linearly with input |
| 15 | phone_charges is always an integer |
| 16 | km_driven has at most 1 decimal place |

#### `formatToast`
| # | Test name |
|---|---|
| 17 | replaces {phone_charges} token |
| 18 | replaces {km_driven} token |
| 19 | replaces {tree_months} token |
| 20 | handles template with no tokens (returns template unchanged) |
| 21 | handles zero co2e (all replacements become 0) |
| 22 | replaces all three tokens in a single template |

#### `computeBaselineWeekly` — all commute modes
| # | Test name |
|---|---|
| 23 | returns a positive number for all valid input combinations |
| 24 | walk_cycle gives lower baseline than car_solo |
| 25 | larger household gives higher baseline for same commute mode |
| 26 | handles unknown commute mode gracefully (falls back to bus) |
| 27 | handles unknown household size gracefully (defaults to 1.0 multiplier) |
| 28 | metro commute gives lower baseline than two_wheeler |
| 29 | car_shared_2 gives lower baseline than car_solo |
| 30 | result is rounded to 2 decimal places |

---

### `tests/recommendationEngine.test.ts` — 21 tests

#### `countSubcategories`
| # | Test name |
|---|---|
| 1 | returns empty object for empty log array |
| 2 | counts a single subcategory |
| 3 | counts multiple different subcategories |
| 4 | returns exact count for large input |

#### Rule 1 — food delivery
| # | Test name |
|---|---|
| 5 | does NOT trigger below threshold (3 orders) |
| 6 | triggers at exactly 4 orders |
| 7 | money_saved_inr_week is a positive number |

#### Rule 2 — solo driving
| # | Test name |
|---|---|
| 8 | does NOT trigger when transit use is high |
| 9 | triggers when solo drives >= 6 and transit < 3 |
| 10 | co2_saved_kg_week is positive |

#### Rule 3 — AC usage
| # | Test name |
|---|---|
| 11 | does NOT trigger below 10 hours |
| 12 | triggers at 10+ hours |

#### Rule 4 — meat consumption
| # | Test name |
|---|---|
| 13 | triggers at 8+ meat meals |
| 14 | does NOT trigger at 7 meals |

#### Rule 5 — online shopping
| # | Test name |
|---|---|
| 15 | triggers at 5+ orders |
| 16 | does NOT trigger at 4 orders |

#### `getRecommendations` — fallback and meta behaviour
| # | Test name |
|---|---|
| 17 | returns fallback recommendation when no rules trigger |
| 18 | returns at most 3 recommendations even when all rules trigger |
| 19 | results are sorted by priority ascending |
| 20 | all returned recommendations have required fields |
| 21 | fallback has priority 99 (lowest) |

---

### `tests/streaks.test.ts` — 14 tests

#### `toLocalDateStr`
| # | Test name |
|---|---|
| 1 | converts ISO string to YYYY-MM-DD |

#### `calculateStreak` — basic cases
| # | Test name |
|---|---|
| 2 | returns zero streak for no logs |
| 3 | returns streak of 1 for a single log today |
| 4 | returns streak of 0 when last log was 2+ days ago |
| 5 | counts consecutive days correctly |
| 6 | handles gap in streak correctly |
| 7 | multiple logs on same day count as one day |

#### `calculateStreak` — timezone boundary cases
| # | Test name |
|---|---|
| 8 | log at 11:59pm and 12:01am on next day both count separately |

#### `checkNewBadges`
| # | Test name |
|---|---|
| 9 | awards streak_3 at 3-day streak |
| 10 | awards streak_7 at 7-day streak |
| 11 | does not re-award already-earned badges |
| 12 | awards first_carpool when carpool log exists |
| 13 | awards first_walk for walk_cycle log |
| 14 | returns empty array when no new badges apply |

---

### `tests/validation.test.ts` — 32 tests

#### `validateLog` — valid inputs
| # | Test name |
|---|---|
| 1 | accepts a valid transport log |
| 2 | accepts zero co2e (walk_cycle) |
| 3 | accepts all valid categories |
| 4 | normalises co2e to at most 4 decimal places |
| 5 | normalises cost to at most 2 decimal places |
| 6 | accepts co2e right at the boundary (MAX_CO2E_PER_LOG) |

#### `validateLog` — rejection cases
| # | Test name |
|---|---|
| 7 | rejects unknown category |
| 8 | rejects unknown subcategory |
| 9 | rejects negative co2e |
| 10 | rejects NaN co2e |
| 11 | rejects Infinity co2e |
| 12 | rejects co2e exceeding MAX_CO2E_PER_LOG |
| 13 | rejects negative cost |
| 14 | rejects cost exceeding MAX_COST_INR |

#### `validateEmail` — valid inputs
| # | Test name |
|---|---|
| 15 | accepts a standard email |
| 16 | trims whitespace and lowercases |
| 17 | accepts subdomains |

#### `validateEmail` — rejection cases
| # | Test name |
|---|---|
| 18 | rejects empty string |
| 19 | rejects whitespace-only string |
| 20 | rejects missing @ |
| 21 | rejects missing TLD |
| 22 | rejects email that is too long |

#### `sanitiseDisplayName`
| # | Test name |
|---|---|
| 23 | returns empty string for empty input (field is optional) |
| 24 | trims leading/trailing whitespace |
| 25 | collapses multiple internal spaces |
| 26 | removes control characters |
| 27 | accepts Unicode characters (Indian names) |
| 28 | rejects names exceeding MAX_DISPLAY_NAME_LENGTH |
| 29 | accepts name exactly at MAX_DISPLAY_NAME_LENGTH |

#### Exported constants
| # | Test name |
|---|---|
| 30 | MAX_LOGS is a reasonable positive integer |
| 31 | MAX_CO2E_PER_LOG is large enough for a transatlantic flight |
| 32 | MAX_COST_INR is large enough for a business-class flight |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| UI framework | React 18 + Vite 5 + TypeScript | Typed, fast HMR, PWA plugin available |
| Styling | Tailwind CSS v3 + custom design tokens | Cream/gold palette with no eco-green |
| State management | React Context + `useReducer` | No external lib — keeps bundle tiny |
| Persistence | `localStorage` (primary) + Supabase (sync) | Local-first: works offline by default |
| Auth | Supabase Magic Link OTP | Passwordless, no credential storage |
| Charts | `recharts` | Lightweight SVG bar charts |
| Sharing | `html-to-image` | Client-side PNG recap card, no server |
| PWA | `vite-plugin-pwa` + Workbox | Service worker caches all assets |
| Testing | Vitest + jsdom | Zero-config, ESM-native |
| Deployment | Firebase Hosting (Google Cloud) | Free tier, global CDN, HTTPS |

---

## ⚡ Setup

### Prerequisites
- Node.js 18+ (tested on Node 24)
- A [Supabase](https://supabase.com) project (free tier, optional — app works offline without it)

### 1. Install dependencies
```bash
cd tally
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase project URL and public anon key:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
> **If you leave these blank**, the app runs in fully local-only mode. All logging, streaks, recommendations, and chart calculations continue to work. The sync indicator will show but no network requests will be made.

### 3. Set up Supabase database (optional)
Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) into the Supabase SQL Editor and run it. This creates:

| Table / View | Purpose | RLS |
| :--- | :--- | :--- |
| `profiles` | User display name, commute mode, household size, baseline | ✅ user-scoped |
| `logs` | Every logged activity with CO₂e, cost, timestamp | ✅ user-scoped |
| `streaks` | Pre-computed streak data for performance | ✅ user-scoped |
| `badges` | Earned badge IDs per user | ✅ user-scoped |
| `leaderboard` | Aggregated view: % reduction vs baseline only | ✅ public read, no PII exposed |

### 4. Run locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. For mobile testing, use `npm run dev -- --host` and open the LAN IP on your phone.

### 5. Run tests
```bash
npm run test          # Run all 97 tests once
npm run test:watch    # Re-run on file change
npm run test:ui       # Open Vitest browser UI
```

### 6. Build for production
```bash
npm run build         # Outputs to dist/ — TypeScript type-checked first
npm run preview       # Preview the production build locally
```

---

## 🔒 Security

| Measure | Location | Detail |
| :--- | :--- | :--- |
| Content Security Policy | [`index.html`](index.html) | Restricts `script-src`, `style-src`, `connect-src` to `self` + Supabase domain only |
| Input validation | [`src/lib/validation.ts`](src/lib/validation.ts) | All user data passes through `validateLog()`, `validateEmail()`, `sanitiseDisplayName()` before storage |
| Bounded inputs | `validation.ts` | `MAX_CO2E_PER_LOG = 5000`, `MAX_COST_INR = 500,000`, `MAX_DISPLAY_NAME_LENGTH = 50` |
| Log cap | `AppContext.tsx` | `MAX_LOGS = 500` — prevents unbounded localStorage growth |
| Control character stripping | `validation.ts` | `sanitiseDisplayName()` removes `\x00–\x1F` and `\x7F` |
| Referrer policy | `index.html` | `strict-origin-when-cross-origin` |
| No secrets in code | `supabaseClient.ts` | Only `VITE_*` env vars used — never committed |
| RLS on all tables | `supabase/schema.sql` | Users can only read/write their own rows |

---

## 🏗️ Architecture Decisions

### Local-First with Background Sync
Logs are written to `localStorage` first (synchronously), then synced to Supabase in the background when the user is authenticated and online. This means:
- Logging never fails due to network issues
- The app opens instantly on repeat visits
- Offline badge shows and disappears automatically via `window` online/offline events

### Stale-Closure Fix in `addLog`
React's `useCallback` captures state values at the time the callback is created. The original `addLog` had a bug where it captured a stale reference to `state.logs`, causing the synced-flag update to overwrite the array with an old snapshot. This is fixed using a `useRef` that always points to the latest state:

```ts
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);
// All callbacks read from stateRef.current, not from state directly
```

### Pure Function Library
All business logic lives in `src/lib/` as pure functions with zero dependencies on React, DOM, or network. This makes every calculation fully unit-testable and easy to audit:

| Function | Input → Output |
| :--- | :--- |
| `calculateFootprint(logs)` | `LogEntry[]` → `FootprintTotals` |
| `toComparisons(co2e_kg)` | `number` → `RelatableComparison` |
| `formatToast(template, co2e_kg)` | `string, number` → `string` |
| `computeBaselineWeekly(params)` | `{ commute_mode, household_size }` → `number` |
| `getRecommendations(logs)` | `LogEntry[]` → `Recommendation[]` (max 3) |
| `calculateStreak(logs)` | `LogEntry[]` → `StreakInfo` |
| `checkNewBadges(logs, streak, earned)` | ... → `Badge[]` |
| `validateLog(input)` | `RawLogInput` → `ValidationResult` |

### Custom Hooks for Data Access
UI components never compute aggregates inline. All filtered/aggregated data comes from memoised hooks in `src/hooks/useLogs.ts`:

```ts
useFilteredLogs(range)       // logs in today / 7d / 30d window
useFootprintSummary(range)   // totals + comparisons + cost
useTodayCounts()             // subcategory → count map for tile badges
useRecentLogs(days?)         // last N days of logs for recommendation engine
```

---

## 📊 Emission Factor Methodology

All conversion factors are in [`src/data/emissionFactors.json`](src/data/emissionFactors.json) and are fully cited:

| Activity | Factor | Source |
| :--- | :--- | :--- |
| Grid electricity (India) | **0.71 kg CO₂e / kWh** | Central Electricity Authority (CEA) India, CO₂ Baseline Database, FY 2022-23, weighted national average |
| Public bus | **0.105 kg CO₂e / km** | DEFRA UK Government GHG Conversion Factors 2025 |
| Metro / urban rail | **0.044 kg CO₂e / km** | DEFRA UK Government GHG Conversion Factors 2025 |
| Car — solo | **0.171 kg CO₂e / km** | DEFRA UK Government GHG Conversion Factors 2025 (average petrol car) |
| Car — shared (2 people) | **0.086 kg CO₂e / km** | DEFRA ÷ 2 passengers |
| Two-wheeler (scooter) | **0.113 kg CO₂e / km** | DEFRA motorcycle category |
| Domestic flight | **0.255 kg CO₂e / km** | DEFRA aviation (economy, with RFI multiplier) |
| Meat meal | **3.3 kg CO₂e / meal** | IPCC AR6 default emission factors — beef average |
| Vegetarian meal | **0.9 kg CO₂e / meal** | IPCC AR6 default emission factors — grain/vegetable average |
| Food delivery packaging | **0.5 kg CO₂e / order** | Estimated — last-mile logistics + packaging; cited as estimated in JSON |
| 1 kg CO₂e ≡ smartphone charges | **121 charges** | US EPA GHG equivalencies calculator, scaled to India grid intensity |
| 1 kg CO₂e ≡ km driven | **5.85 km** | Derived from DEFRA average car factor |
| 1 kg CO₂e ≡ tree-months | **0.067 months** | US EPA — one tree sequesters ~21.8 kg CO₂/year |

> *Estimated values are flagged with `"estimated": true` in the JSON file. All others reference a specific public dataset.*

---

## 🎨 Design System

The colour palette is deliberately **not eco-green** — it feels like a premium personal finance app:

| Token | Hex | Used for |
| :--- | :--- | :--- |
| `gold-500` | `#B8860B` | Primary CTA buttons, badge highlights, active tabs |
| `cream-100` | `#FDFAF3` | Page background |
| `cream-200` | `#F5EDD8` | Card backgrounds, tile backgrounds |
| `charcoal-900` | `#1A1814` | Headings, primary text |
| `charcoal-500` | `#6B6558` | Secondary text, axis labels |
| `rust-400` | `#C75B3F` | Food category colour in charts |
| `sage-400` | `#84A98C` | Home category colour in charts |

Typography: **DM Serif Display** (headings) + **Inter** (body) via Google Fonts.

---

## 🚫 Explicit Non-Features (by design)

These were deliberately excluded per the problem statement:

- ❌ No leaf icons, no "eco warrior" language, no shame copy
- ❌ No paid APIs — zero API keys needed to use the core app
- ❌ No native mobile app — PWA only (installable on Android/iOS home screen)
- ❌ No real payment/voucher backend — reward list is UI only
- ❌ No LLM calls — recommendations are deterministic rule-based logic (auditable, zero latency, works offline)

---

## 📄 License

MIT — see [LICENSE](LICENSE) if present.
