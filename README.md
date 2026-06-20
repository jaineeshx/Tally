# Tally — A Carbon Footprint App for People Who Don't Care About Carbon

Tally is a mobile-first Progressive Web Application (PWA) designed to help people understand, track, and reduce their daily footprint by framing decisions in terms of **monetary cost** and **relatable everyday comparisons** (like phone charges) instead of eco-guilt or leaf icons.

It runs fully offline-capable, uses zero paid APIs, and is built for a hackathon submission.

## 🔗 Live Demo
The application is deployed on Google Cloud (Firebase Hosting) and is live at:
**[https://ballot-oracle.web.app](https://ballot-oracle.web.app)**

---

## 🚀 Rubric Mapping

This project maps directly to the hackathon evaluation categories:

| Rubric Phrase | Feature implementation | File Reference |
| :--- | :--- | :--- |
| **Track** | One-tap quick-log tiles write immediately to localStorage first and sync to Supabase when connected. Keeps live daily counters. | [Home.tsx](file:///E:/CC/tally/src/pages/Home.tsx) |
| **Understand** | Converts abstract CO₂ kg weights into equivalent smartphone charges, km driven, and tree-months, showing interactive trend charts. | [Dashboard.tsx](file:///E:/CC/tally/src/pages/Dashboard.tsx) |
| **Reduce** | Custom rule-based recommendation engine triggers cost-saving, carbon-reducing habits. | [recommendationEngine.ts](file:///E:/CC/tally/src/lib/recommendationEngine.ts) |
| **Simple Actions** | Direct grid tiles require no modals, no form inputs, and zero friction. One tap = one log. | [categories.ts](file:///E:/CC/tally/src/data/categories.ts) |
| **Personalized Insights** | Triggers targeted suggestions (e.g. food delivery, solo driving, AC duration) based on last 14 days log patterns. | [RecommendationsList.tsx](file:///E:/CC/tally/src/components/recommendations/RecommendationsList.tsx) |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Light cream and gold palette for premium budgeting aesthetics)
- **State & Sync:** React Context (`AppContext.tsx`) managing local-first storage and syncing to Supabase DB.
- **PWA:** `vite-plugin-pwa` handles service worker caching for full offline capability.
- **Charts:** `recharts` for scannable daily trend visualization.
- **Sharing:** `html-to-image` client-side canvas generation for downloadable weekly summaries.

---

## ⚡ Setup & Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Supabase credentials (URL and public anon key) to `.env`. If left empty, the application gracefully degrades to local-only mode, and all logging/streak calculations continue to work offline.

### 3. Setup Supabase SQL Database
Run the schema script located at [schema.sql](file:///E:/CC/tally/supabase/schema.sql) in your Supabase SQL editor to create:
- `profiles` table (Row Level Security enabled)
- `logs` table (Row Level Security enabled)
- `streaks` table (Row Level Security enabled)
- `badges` table (Row Level Security enabled)
- `leaderboard` view (aggregated reduction percentages only, protecting user privacy)

### 4. Run Development Server
```bash
npm run dev
```

### 5. Run Unit Tests
Verify core pure functions (footprint calculators, streak trackers, recommendation rules) using Vitest:
```bash
npm run test
```

---

## 📊 Sourcing Methodology & Sincerity

All conversion factors are compiled client-side in [emissionFactors.json](file:///E:/CC/tally/src/data/emissionFactors.json) using the following public citations:
1. **Grid Electricity:** Central Electricity Authority (CEA) of India, CO2 Baseline Database weighted national average (FY 2022-23) — **0.71 kg CO₂e / kWh**.
2. **Transportation:** DEFRA UK government conversion factors (2025 updates) for public bus, metro, and typical single-occupant passenger cars.
3. **Equivalencies:** US Environmental Protection Agency (EPA) greenhouse gas equivalencies calculator for translating kg CO₂e into smartphone charges (scaled to India grid metrics) and tree-months sequestration.
4. **Food:** IPCC default emission factors for beef/chicken (meat average) vs grain/vegetables (veg average).

*Note: For the hackathon build, average last-mile delivery packaging weight and transport emissions are estimated and cited in the JSON data source.*
