import type { DerivedMetrics, ScorecardWeights, ScoredRecord, WeeklyRecord } from "../types";

export const DEFAULT_WEIGHTS: ScorecardWeights = {
  schedule: 30,
  efficiency: 40,
  quality: 15,
  safety: 15,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Turn a raw WeeklyRecord into a fully-scored record.
 * Philosophy: we care about whether the crew got the job done (schedule)
 * and how efficiently they did it (earned hours vs. actual hours worked),
 * not raw cost. Crew size is surfaced separately so bigger crews with more
 * raw hours aren't mistaken for better performers.
 */
export function scoreRecord(record: WeeklyRecord, weights: ScorecardWeights): ScoredRecord {
  const actualHours = record.actualHours || 0;
  const earnedHours = record.earnedHours || 0;
  const crewSize = record.crewSize || 1;

  const performanceFactor = actualHours > 0 ? earnedHours / actualHours : 0;
  const earnedHoursPerPerson = earnedHours / crewSize;
  const actualHoursPerPerson = actualHours / crewSize;
  const scheduleVariancePts = record.actualPercentComplete - record.targetPercentComplete;

  const qualityRate =
    record.inspectionsPerformed > 0
      ? ((record.inspectionsPerformed - record.inspectionsRejected) / record.inspectionsPerformed) * 100
      : 100;

  // Schedule score: 100 at/ahead of target, sliding down for each point behind.
  const scheduleScore = clamp(100 + scheduleVariancePts * 4, 0, 100);

  // Efficiency score: PF of 1.0 (earned = actual) is fully on-plan = 100.
  // PF > 1 (did more work than hours charged) still caps at 100 for readability.
  const efficiencyScore = clamp(performanceFactor * 100, 0, 100);

  const qualityScore = clamp(qualityRate, 0, 100);

  // Safety score: normalized by crew size (an incident rate, not a raw count) so
  // that summing incidents across a bigger group (e.g. all of Module 4) doesn't
  // unfairly tank the score relative to a single small crew.
  const incidentRate = (record.safetyIncidents / crewSize) * 100; // incidents per 100 people
  const safetyScore = clamp(100 - incidentRate * 4, 0, 100);

  const totalWeight = weights.schedule + weights.efficiency + weights.quality + weights.safety || 1;
  const compositeScore =
    (scheduleScore * weights.schedule +
      efficiencyScore * weights.efficiency +
      qualityScore * weights.quality +
      safetyScore * weights.safety) /
    totalWeight;

  const derived: DerivedMetrics = {
    performanceFactor,
    earnedHoursPerPerson,
    actualHoursPerPerson,
    scheduleVariancePts,
    qualityRate,
    scheduleScore,
    efficiencyScore,
    qualityScore,
    safetyScore,
    compositeScore,
  };

  return { ...record, ...derived };
}

export function scoreRecords(records: WeeklyRecord[], weights: ScorecardWeights): ScoredRecord[] {
  return records.map((r) => scoreRecord(r, weights));
}
