# Module 4 Performance Dashboard

A weekly balanced scorecard for Module 4 of the boat build: filter by hull, trade,
supervisor, shift/crew, and work package, then see how each group ranks week to
week on schedule, efficiency, quality, and safety.

## Opening in Cursor

1. Unzip/copy this folder somewhere on disk.
2. Open the folder in Cursor (`File > Open Folder`).
3. Open a terminal in Cursor and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the URL Vite prints (usually `http://localhost:5173`).

This was scaffolded without running `npm install` (no network access in the
build sandbox), so the first `npm install` will take a minute — that's expected.

## What's inside

- **Filters**: Hull, Trade, Supervisor, Shift, Work Package, and a week range,
  plus a "Rank by" selector (Supervisor / Crew / Trade / Hull).
- **Scorecard summary**: four balanced-scorecard perspectives — Schedule,
  Efficiency, Quality, Safety — plus a weighted Composite score, each with a
  red/amber/green status. Efficiency is earned hours ÷ actual hours worked
  (performance factor), not cost — it answers "did they get the job done, and
  how efficiently," independent of budget.
- **Trend charts**: the same metrics over the last 12 weeks.
- **Weekly ranking table**: automatically ranks whatever dimension you pick
  (e.g. Supervisor) each week by composite score. Crew headcount and "earned
  hours per person" are shown alongside raw earned hours, so a trade with more
  people isn't mistaken for a better performer just because its total hours
  are bigger.
- **Settings panel** (gear icon): adjust the weighting between Schedule /
  Efficiency / Quality / Safety, add or remove trades (defaults: Pipe,
  Structural, Electrical, Paint & Sound Dampening, Sheetmetal, OSM), and
  import your own CSV data.

## Data model

Right now the app runs on generated sample data (`src/data/mockData.ts`) so
the dashboard is fully working out of the box. To bring in real data:

1. Settings → **Download CSV template** to get the exact column headers.
2. Export your tracking data into that shape — one row per Hull + Trade +
   Supervisor + Crew + Week.
3. Settings → **Import CSV...**

Required columns: `week, hull, trade, supervisor, shift, crew, workPackage,
crewSize, targetPercentComplete, actualPercentComplete, budgetedHours,
earnedHours, actualHours, inspectionsPerformed, inspectionsRejected,
safetyIncidents`. `module` is optional and defaults to "Module 4".

The scoring logic lives in `src/utils/scoring.ts` (per-record scores) and
`src/utils/aggregate.ts` (grouping/ranking + scorecard summary rollups) — that's
the place to tune formulas, e.g. how heavily a safety incident should weigh, or
how schedule variance maps to a 0-100 score.

## Project structure

```
src/
  types.ts              data model + filter types
  data/mockData.ts       sample data generator
  utils/scoring.ts        per-record balanced-scorecard scoring
  utils/aggregate.ts      grouping, ranking, scorecard rollups
  utils/csv.ts            CSV import/template
  components/             FilterBar, ScorecardSummary, TrendCharts,
                          RankingTable, SettingsPanel, MultiSelect, Header
  App.tsx                 wires it all together, persists weights/trades
                          to localStorage
```

## Extending to other modules

Every record has a `module` field (fixed to "Module 4" today). To support
other modules later, add a Module filter alongside Hull/Trade/Supervisor in
`FilterBar.tsx` and `App.tsx` — the scoring and ranking logic already work on
any subset of records, so no changes needed there.
