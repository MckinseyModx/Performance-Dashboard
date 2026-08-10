import { useEffect, useMemo, useState } from "react";
import type { RankedGroup } from "../utils/aggregate";
import { ragForScore } from "../types";
import type { RankByDimension } from "../types";

interface RankingTableProps {
  groups: RankedGroup[];
  dimension: RankByDimension;
  rankEarnedHoursWeight: number;
  week: string | null;
}

type SortKey =
  | "rank"
  | "groupLabel"
  | "crewSize"
  | "earnedHours"
  | "earnedHoursPerPerson"
  | "actualPercentComplete"
  | "performanceFactor"
  | "qualityScore"
  | "safetyScore"
  | "compositeScore";

const RAG_DOT: Record<string, string> = {
  green: "bg-mck-teal",
  amber: "bg-mck-gold",
  red: "bg-mck-red",
};

const DIMENSION_LABEL: Record<RankByDimension, string> = {
  supervisor: "Supervisor",
  crew: "Crew",
  trade: "Trade",
  shift: "Shift",
  hull: "Boat",
  module: "Module",
};

function rankingLabel(weight: number): string {
  if (weight >= 100) return "earned hours";
  if (weight <= 0) return "composite score";
  return `${100 - weight}% composite / ${weight}% earned hours`;
}

export default function RankingTable({ groups, dimension, rankEarnedHoursWeight, week }: RankingTableProps) {
  const rankByEarnedHours = rankEarnedHoursWeight >= 100;
  const [sortKey, setSortKey] = useState<SortKey>(rankByEarnedHours ? "earnedHours" : "rank");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setSortKey(rankByEarnedHours ? "earnedHours" : "rank");
    setSortAsc(rankByEarnedHours ? false : true);
  }, [rankByEarnedHours]);

  const weekGroups = useMemo(() => (week ? groups.filter((g) => g.week === week) : []), [groups, week]);

  const sorted = useMemo(() => {
    const copy = [...weekGroups];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortAsc ? an - bn : bn - an;
    });
    return copy;
  }, [weekGroups, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(key === "rank" || key === "groupLabel");
    }
  }

  function headerButton(key: SortKey, label: string) {
    const active = sortKey === key;
    return (
      <button
        onClick={() => toggleSort(key)}
        className={`flex items-center gap-1 whitespace-nowrap ${active ? "text-mck-navy" : "text-mck-gray-600"}`}
      >
        {label}
        {active && <span className="text-[10px]">{sortAsc ? "▲" : "▼"}</span>}
      </button>
    );
  }

  if (!week || weekGroups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
        No data to rank for this selection.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-mck-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-mck-gray-200 bg-mck-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-mck-navy">
          Weekly Ranking by {DIMENSION_LABEL[dimension]} ({rankingLabel(rankEarnedHoursWeight)}) — week of {week}
        </h3>
        <span className="text-xs text-mck-gray-400">{weekGroups.length} groups</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-mck-gray-50 text-xs uppercase tracking-wide text-mck-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">{headerButton("rank", "Rank")}</th>
              <th className="px-3 py-2 text-left">{headerButton("groupLabel", DIMENSION_LABEL[dimension])}</th>
              <th className="px-3 py-2 text-right">{headerButton("crewSize", "Crew Size")}</th>
              <th className="px-3 py-2 text-right">{headerButton("earnedHours", "Earned Hrs")}</th>
              <th className="px-3 py-2 text-right">{headerButton("earnedHoursPerPerson", "Earned Hrs / Person")}</th>
              <th className="px-3 py-2 text-right">{headerButton("actualPercentComplete", "% Complete")}</th>
              <th className="px-3 py-2 text-right">{headerButton("performanceFactor", "Perf. Factor")}</th>
              <th className="px-3 py-2 text-right">{headerButton("qualityScore", "Quality")}</th>
              <th className="px-3 py-2 text-right">{headerButton("safetyScore", "Safety")}</th>
              <th className="px-3 py-2 text-right">{headerButton("compositeScore", "Score")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => (
              <tr key={g.groupKey} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-700">#{g.rank}</td>
                <td className="px-3 py-2 text-slate-700">{g.groupLabel}</td>
                <td className="px-3 py-2 text-right text-slate-600">{g.crewSize}</td>
                <td className="px-3 py-2 text-right text-slate-600">{g.earnedHours.toFixed(0)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{g.earnedHoursPerPerson.toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {g.actualPercentComplete.toFixed(1)}%
                  <span className="ml-1 text-xs text-slate-400">
                    ({g.scheduleVariancePts >= 0 ? "+" : ""}
                    {g.scheduleVariancePts.toFixed(1)})
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{g.performanceFactor.toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{g.qualityScore.toFixed(0)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{g.safetyScore.toFixed(0)}</td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                    <span className={`h-2 w-2 rounded-full ${RAG_DOT[ragForScore(g.compositeScore)]}`} />
                    {g.compositeScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
