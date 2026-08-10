import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyRecord } from "../types";
import { computeInsights } from "../utils/insights";

interface InsightsPanelProps {
  records: WeeklyRecord[];
  week: string | null;
}

function KpiCard({ title, value, detail, tone = "default" }: { title: string; value: string; detail: string; tone?: "default" | "warn" }) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        tone === "warn" ? "border-mck-red/30 bg-white border-l-4 border-l-mck-red" : "border-mck-gray-200 bg-white"
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-mck-gray-600">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-mck-navy">{value}</div>
      <div className="mt-1 text-xs text-mck-gray-600">{detail}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-mck-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-mck-navy">{title}</h3>
      <div className="h-72">{children}</div>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function InsightsPanel({ records, week }: InsightsPanelProps) {
  const weekRecords = useMemo(() => (week ? records.filter((r) => r.week === week) : records), [records, week]);
  const insights = useMemo(() => computeInsights(weekRecords, 10), [weekRecords]);

  if (weekRecords.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-mck-gray-200 bg-white p-6 text-center text-sm text-mck-gray-400">
        No records match the current filters.
      </div>
    );
  }

  const keyAreaChartData = insights.byKeyArea.map((row) => ({
    name: row.key,
    onTrack: row.total - row.delayed,
    delayed: row.delayed,
  }));

  const supervisorChartData = insights.bySupervisor.slice(0, 10).map((row) => ({
    name: row.key,
    onTrack: row.total - row.delayed,
    delayed: row.delayed,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-mck-navy">Deeper Insights</h2>
          <span className="text-xs text-mck-gray-400">{week ? `Week of ${formatDate(week)}` : "All weeks"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard title="Total Work Orders" value={insights.totalOrders.toLocaleString()} detail="in the current filter" />
          <KpiCard
            title="Delayed Work Orders"
            value={insights.delayedCount.toLocaleString()}
            detail={`${insights.delayedPct.toFixed(0)}% of total — past due, not yet closed`}
            tone={insights.delayedCount > 0 ? "warn" : "default"}
          />
          <KpiCard
            title="Avg. Plan → Cut"
            value={insights.avgPlanToCutDays !== null ? `${insights.avgPlanToCutDays.toFixed(0)}d` : "—"}
            detail="days from mfg plan to mfg cut"
          />
          <KpiCard
            title="Avg. Cut → Action Cut"
            value={insights.avgCutToActionCutDays !== null ? `${insights.avgCutToActionCutDays.toFixed(0)}d` : "—"}
            detail="days from mfg cut to action cut"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Work Orders by Key Area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keyAreaChartData} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="onTrack" name="On track" stackId="a" fill="#051C2C" />
              <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#F2A9A9" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Work Orders by Supervisor (Foreman)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supervisorChartData} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="onTrack" name="On track" stackId="a" fill="#051C2C" />
              <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#F2A9A9" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="overflow-hidden rounded-lg border border-mck-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mck-gray-200 bg-mck-gray-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-mck-navy">Most Overdue Work Orders</h3>
          <span className="text-xs text-mck-gray-400">Top {insights.mostOverdue.length}</span>
        </div>
        {insights.mostOverdue.length === 0 ? (
          <div className="p-6 text-center text-sm text-mck-gray-400">Nothing overdue in this selection.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mck-gray-50 text-xs uppercase tracking-wide text-mck-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Work Order</th>
                  <th className="px-3 py-2 text-left">Boat</th>
                  <th className="px-3 py-2 text-left">Trade</th>
                  <th className="px-3 py-2 text-left">Supervisor</th>
                  <th className="px-3 py-2 text-left">Key Area</th>
                  <th className="px-3 py-2 text-right">Due Date</th>
                  <th className="px-3 py-2 text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {insights.mostOverdue.map(({ record, daysOverdue: overdue }) => (
                  <tr key={record.id} className="border-t border-mck-gray-100 hover:bg-mck-gray-50">
                    <td className="px-3 py-2 text-mck-gray-800">{record.workPackage || "—"}</td>
                    <td className="px-3 py-2 text-mck-gray-600">{record.hull}</td>
                    <td className="px-3 py-2 text-mck-gray-600">{record.trade}</td>
                    <td className="px-3 py-2 text-mck-gray-600">{record.supervisor}</td>
                    <td className="px-3 py-2 text-mck-gray-600">{record.keyArea || "—"}</td>
                    <td className="px-3 py-2 text-right text-mck-gray-600">{formatDate(record.actionDue || record.mfgDueDate)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-mck-red">{overdue}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-mck-gray-200 bg-white shadow-sm">
          <div className="border-b border-mck-gray-200 bg-mck-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-mck-navy">By Trade</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-mck-gray-50 text-xs uppercase tracking-wide text-mck-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Trade</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Delayed</th>
                <th className="px-3 py-2 text-right">Delayed %</th>
              </tr>
            </thead>
            <tbody>
              {insights.byTrade.map((row) => (
                <tr key={row.key} className="border-t border-mck-gray-100">
                  <td className="px-3 py-2 text-mck-gray-800">{row.key}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.total}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.delayed}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.delayedPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-mck-gray-200 bg-white shadow-sm">
          <div className="border-b border-mck-gray-200 bg-mck-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-mck-navy">By Key Area</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-mck-gray-50 text-xs uppercase tracking-wide text-mck-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Key Area</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Delayed</th>
                <th className="px-3 py-2 text-right">Delayed %</th>
              </tr>
            </thead>
            <tbody>
              {insights.byKeyArea.map((row) => (
                <tr key={row.key} className="border-t border-mck-gray-100">
                  <td className="px-3 py-2 text-mck-gray-800">{row.key}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.total}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.delayed}</td>
                  <td className="px-3 py-2 text-right text-mck-gray-600">{row.delayedPct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
