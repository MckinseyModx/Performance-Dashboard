import type { WeeklyRecord } from "../types";

function parseIso(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(fromIso?: string, toIso?: string): number | null {
  const from = parseIso(fromIso);
  const to = parseIso(toIso);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * A work order counts as delayed if it isn't done (by status, falling back to
 * % complete if no status column was supplied) and its due date has already
 * passed as of the week this row is a snapshot of.
 */
export function isDelayed(record: WeeklyRecord): boolean {
  const notDone = record.actionStatus
    ? record.actionStatus.trim().toLowerCase() !== "closed"
    : record.mfgStatus
      ? record.mfgStatus.trim().toLowerCase() !== "complete"
      : record.actualPercentComplete < 100;

  if (!notDone) return false;

  const dueIso = record.actionDue || record.mfgDueDate;
  const overdue = daysBetween(dueIso, record.week);
  return overdue !== null && overdue > 0;
}

export function daysOverdue(record: WeeklyRecord): number {
  if (!isDelayed(record)) return 0;
  const dueIso = record.actionDue || record.mfgDueDate;
  return Math.max(0, daysBetween(dueIso, record.week) ?? 0);
}

export function planToCutDays(record: WeeklyRecord): number | null {
  return daysBetween(record.mfgPlan, record.mfgCut);
}

export function cutToActionCutDays(record: WeeklyRecord): number | null {
  return daysBetween(record.mfgCut, record.actionCut);
}

interface BreakdownRow {
  key: string;
  total: number;
  delayed: number;
  delayedPct: number;
}

function breakdownBy(records: WeeklyRecord[], selector: (r: WeeklyRecord) => string | undefined): BreakdownRow[] {
  const buckets = new Map<string, { total: number; delayed: number }>();
  for (const r of records) {
    const key = selector(r) || "(unspecified)";
    const bucket = buckets.get(key) ?? { total: 0, delayed: 0 };
    bucket.total += 1;
    if (isDelayed(r)) bucket.delayed += 1;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .map(([key, v]) => ({ key, total: v.total, delayed: v.delayed, delayedPct: v.total > 0 ? (v.delayed / v.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export interface OverdueEntry {
  record: WeeklyRecord;
  daysOverdue: number;
}

export interface InsightsSummary {
  totalOrders: number;
  delayedCount: number;
  delayedPct: number;
  avgPlanToCutDays: number | null;
  avgCutToActionCutDays: number | null;
  byKeyArea: BreakdownRow[];
  bySupervisor: BreakdownRow[];
  byTrade: BreakdownRow[];
  mostOverdue: OverdueEntry[];
}

export function computeInsights(records: WeeklyRecord[], topN = 10): InsightsSummary {
  const totalOrders = records.length;
  const delayedRecords = records.filter(isDelayed);
  const delayedCount = delayedRecords.length;

  const planToCut = records.map(planToCutDays).filter((v): v is number => v !== null);
  const cutToActionCut = records.map(cutToActionCutDays).filter((v): v is number => v !== null);

  const mostOverdue = delayedRecords
    .map((record) => ({ record, daysOverdue: daysOverdue(record) }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, topN);

  return {
    totalOrders,
    delayedCount,
    delayedPct: totalOrders > 0 ? (delayedCount / totalOrders) * 100 : 0,
    avgPlanToCutDays: average(planToCut),
    avgCutToActionCutDays: average(cutToActionCut),
    byKeyArea: breakdownBy(records, (r) => r.keyArea),
    bySupervisor: breakdownBy(records, (r) => r.supervisor),
    byTrade: breakdownBy(records, (r) => r.trade),
    mostOverdue,
  };
}
