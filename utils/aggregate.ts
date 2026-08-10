import type { RankByDimension, ScorecardWeights, ScoredRecord, WeeklyRecord } from "../types";
import { scoreRecord } from "./scoring";

export interface RankedGroup extends ScoredRecord {
  groupKey: string;
  groupLabel: string;
  rank: number;
  recordCount: number;
}

function dimensionValue(record: WeeklyRecord, dimension: RankByDimension): string {
  switch (dimension) {
    case "supervisor":
      return record.supervisor;
    case "crew":
      return record.crew;
    case "trade":
      return record.trade;
    case "shift":
      return record.shift;
    case "hull":
      return record.hull;
    case "module":
      return record.module;
  }
}

function groupLabelFor(dimension: RankByDimension, label: string): string {
  if (dimension === "module") return `Module ${label}`;
  return label;
}

/**
 * Groups records by week + the chosen ranking dimension, sums up hours/headcount/
 * inspections/incidents, takes a budgeted-hours-weighted average of % complete,
 * then scores the aggregate the same way an individual record is scored.
 */
export function groupAndScore(
  records: WeeklyRecord[],
  dimension: RankByDimension,
  weights: ScorecardWeights,
  rankEarnedHoursWeight = 0
): RankedGroup[] {
  const buckets = new Map<string, WeeklyRecord[]>();

  for (const record of records) {
    const label = dimensionValue(record, dimension);
    const key = `${record.week}__${label}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      buckets.set(key, [record]);
    }
  }

  const grouped: RankedGroup[] = [];

  for (const [key, bucket] of buckets.entries()) {
    const label = dimensionValue(bucket[0], dimension);
    const totalBudgeted = bucket.reduce((sum, r) => sum + r.budgetedHours, 0) || 1;

    const aggregate: WeeklyRecord = {
      id: key,
      week: bucket[0].week,
      hull: dimension === "hull" ? label : uniqueJoin(bucket.map((r) => r.hull)),
      module: dimension === "module" ? label : uniqueJoin(bucket.map((r) => r.module)),
      trade: dimension === "trade" ? label : uniqueJoin(bucket.map((r) => r.trade)),
      supervisor: dimension === "supervisor" ? label : uniqueJoin(bucket.map((r) => r.supervisor)),
      shift: dimension === "shift" ? (label as "Day" | "Night") : bucket[0].shift,
      crew: dimension === "crew" ? label : uniqueJoin(bucket.map((r) => r.crew)),
      workPackage: uniqueJoin(bucket.map((r) => r.workPackage)),
      crewSize: bucket.reduce((sum, r) => sum + r.crewSize, 0),
      targetPercentComplete: weightedAverage(bucket, (r) => r.targetPercentComplete, totalBudgeted),
      actualPercentComplete: weightedAverage(bucket, (r) => r.actualPercentComplete, totalBudgeted),
      budgetedHours: bucket.reduce((sum, r) => sum + r.budgetedHours, 0),
      earnedHours: bucket.reduce((sum, r) => sum + r.earnedHours, 0),
      actualHours: bucket.reduce((sum, r) => sum + r.actualHours, 0),
      inspectionsPerformed: bucket.reduce((sum, r) => sum + r.inspectionsPerformed, 0),
      inspectionsRejected: bucket.reduce((sum, r) => sum + r.inspectionsRejected, 0),
      safetyIncidents: bucket.reduce((sum, r) => sum + r.safetyIncidents, 0),
    };

    const scored = scoreRecord(aggregate, weights);

    grouped.push({
      ...scored,
      groupKey: key,
      groupLabel: groupLabelFor(dimension, label),
      rank: 0,
      recordCount: bucket.length,
    });
  }

  // Rank within each week — blend composite score and earned hours per settings slider.
  const byWeek = new Map<string, RankedGroup[]>();
  for (const g of grouped) {
    const arr = byWeek.get(g.week);
    if (arr) arr.push(g);
    else byWeek.set(g.week, [g]);
  }

  const earnedWeight = clamp(rankEarnedHoursWeight, 0, 100) / 100;

  for (const arr of byWeek.values()) {
    const maxEarnedHours = Math.max(...arr.map((g) => g.earnedHours), 1);
    arr.sort((a, b) => rankingValue(b, earnedWeight, maxEarnedHours) - rankingValue(a, earnedWeight, maxEarnedHours));
    arr.forEach((g, index) => {
      g.rank = index + 1;
    });
  }

  return grouped.sort((a, b) => (a.week === b.week ? a.rank - b.rank : a.week < b.week ? 1 : -1));
}

/**
 * Aggregates an arbitrary list of records (e.g. everything matching the current
 * filters for a single week) into one scored summary record. Used for the
 * top-level scorecard KPI cards.
 */
export function aggregateAll(records: WeeklyRecord[], weights: ScorecardWeights): ScoredRecord | null {
  if (records.length === 0) return null;
  const totalBudgeted = records.reduce((sum, r) => sum + r.budgetedHours, 0) || 1;

  const aggregate: WeeklyRecord = {
    id: "summary",
    week: records[0].week,
    hull: uniqueJoin(records.map((r) => r.hull)),
    module: uniqueJoin(records.map((r) => r.module)),
    trade: uniqueJoin(records.map((r) => r.trade)),
    supervisor: uniqueJoin(records.map((r) => r.supervisor)),
    shift: records[0].shift,
    crew: uniqueJoin(records.map((r) => r.crew)),
    workPackage: uniqueJoin(records.map((r) => r.workPackage)),
    crewSize: records.reduce((sum, r) => sum + r.crewSize, 0),
    targetPercentComplete: weightedAverage(records, (r) => r.targetPercentComplete, totalBudgeted),
    actualPercentComplete: weightedAverage(records, (r) => r.actualPercentComplete, totalBudgeted),
    budgetedHours: records.reduce((sum, r) => sum + r.budgetedHours, 0),
    earnedHours: records.reduce((sum, r) => sum + r.earnedHours, 0),
    actualHours: records.reduce((sum, r) => sum + r.actualHours, 0),
    inspectionsPerformed: records.reduce((sum, r) => sum + r.inspectionsPerformed, 0),
    inspectionsRejected: records.reduce((sum, r) => sum + r.inspectionsRejected, 0),
    safetyIncidents: records.reduce((sum, r) => sum + r.safetyIncidents, 0),
  };

  return scoreRecord(aggregate, weights);
}

function weightedAverage(bucket: WeeklyRecord[], selector: (r: WeeklyRecord) => number, totalWeight: number): number {
  const sum = bucket.reduce((acc, r) => acc + selector(r) * r.budgetedHours, 0);
  return sum / totalWeight;
}

function uniqueJoin(values: string[]): string {
  const unique = Array.from(new Set(values));
  if (unique.length === 1) return unique[0];
  if (unique.length <= 3) return unique.join(", ");
  return `${unique.length} groups`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rankingValue(group: RankedGroup, earnedWeight: number, maxEarnedHours: number): number {
  const earnedNorm = (group.earnedHours / maxEarnedHours) * 100;
  return (1 - earnedWeight) * group.compositeScore + earnedWeight * earnedNorm;
}
