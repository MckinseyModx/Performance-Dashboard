// Dev-only sanity check for the scoring/aggregation logic — not part of the app.
// Run with `npx tsx sanity.ts` after `npm install` if you want to re-verify the
// scoring math outside the browser. Safe to delete.
import { generateMockData, DEFAULT_TRADES } from "./src/data/mockData";
import { DEFAULT_WEIGHTS } from "./src/utils/scoring";
import { aggregateAll, groupAndScore } from "./src/utils/aggregate";

const records = generateMockData(12, DEFAULT_TRADES);
console.log("total records:", records.length);

let bad = 0;
for (const r of records) {
  if (r.actualHours <= 0 || r.earnedHours < 0 || r.crewSize <= 0) bad++;
  if (r.actualPercentComplete < 0 || r.actualPercentComplete > 100) bad++;
}
console.log("bad records (should be 0):", bad);

const lastWeek = records[records.length - 1].week;
const summary = aggregateAll(records.filter((r) => r.week === lastWeek), DEFAULT_WEIGHTS);
console.log("latest week summary:", summary);

const ranked = groupAndScore(records, "supervisor", DEFAULT_WEIGHTS)
  .filter((g) => g.week === lastWeek)
  .sort((a, b) => a.rank - b.rank);
console.log(`ranking for ${lastWeek}:`);
for (const g of ranked) {
  console.log(g.rank, g.groupLabel, "score=", g.compositeScore.toFixed(1));
}
