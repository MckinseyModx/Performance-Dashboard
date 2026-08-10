// Core data model for the Module 4 weekly performance dashboard.
// One WeeklyRecord = one Boat + Module + Trade + Supervisor + Crew, for one week.

export interface WeeklyRecord {
  id: string;
  week: string; // ISO date (Monday) of the work week, e.g. "2026-06-01"
  hull: string; // boat name, e.g. "Boat 1" (stored as hull for CSV compatibility)
  module: string; // module number, e.g. "1", "2", ... "6"
  trade: string; // e.g. "Pipe", "Structural", "Electrical", ...
  supervisor: string;
  shift: "Day" | "Night";
  crew: string; // crew identifier, e.g. "Crew A"
  workPackage: string;
  crewSize: number; // headcount on the crew that week

  // Schedule / progress
  targetPercentComplete: number; // planned cumulative % complete for the week (0-100)
  actualPercentComplete: number; // actual cumulative % complete for the week (0-100)

  // Hours (earned value style)
  budgetedHours: number; // total hours budgeted for the scope this crew owns
  earnedHours: number; // value of work actually completed, in hours
  actualHours: number; // hours actually worked/charged this week

  // Quality
  inspectionsPerformed: number;
  inspectionsRejected: number;

  // Safety
  safetyIncidents: number; // recordable incidents / near-misses this week
}

export type RankByDimension = "supervisor" | "crew" | "trade" | "shift" | "hull" | "module";

export interface Filters {
  hulls: string[];
  modules: string[];
  trades: string[];
  supervisors: string[];
  shifts: string[];
  workPackages: string[];
  weekStart: string | null;
  weekEnd: string | null;
}

export const EMPTY_FILTERS: Filters = {
  hulls: [],
  modules: [],
  trades: [],
  supervisors: [],
  shifts: [],
  workPackages: [],
  weekStart: null,
  weekEnd: null,
};

export interface ScorecardWeights {
  schedule: number; // completion vs. target
  efficiency: number; // earned hours / actual hours (getting the job done efficiently)
  quality: number; // inspection pass rate
  safety: number; // incident-free performance
}

export interface DerivedMetrics {
  performanceFactor: number; // earnedHours / actualHours
  earnedHoursPerPerson: number;
  actualHoursPerPerson: number;
  scheduleVariancePts: number; // actualPercentComplete - targetPercentComplete
  qualityRate: number; // 0-100, % of inspections passed
  scheduleScore: number; // 0-100
  efficiencyScore: number; // 0-100
  qualityScore: number; // 0-100
  safetyScore: number; // 0-100
  compositeScore: number; // 0-100 weighted blend
}

export type ScoredRecord = WeeklyRecord & DerivedMetrics;

export const RAG = {
  GREEN: "green",
  AMBER: "amber",
  RED: "red",
} as const;

export type RagStatus = (typeof RAG)[keyof typeof RAG];

export function ragForScore(score: number): RagStatus {
  if (score >= 90) return RAG.GREEN;
  if (score >= 75) return RAG.AMBER;
  return RAG.RED;
}
