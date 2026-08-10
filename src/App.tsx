import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ScorecardSummary from "./components/ScorecardSummary";
import TrendCharts from "./components/TrendCharts";
import type { WeeklyTrendPoint } from "./components/TrendCharts";
import RankingTable from "./components/RankingTable";
import InsightsPanel from "./components/InsightsPanel";
import SettingsPanel from "./components/SettingsPanel";
import { generateMockData, DEFAULT_TRADES } from "./data/mockData";
import { DEFAULT_WEIGHTS } from "./utils/scoring";
import { aggregateAll, groupAndScore } from "./utils/aggregate";
import { EMPTY_FILTERS } from "./types";
import type { Filters, RankByDimension, ScorecardWeights, WeeklyRecord } from "./types";

const WEIGHTS_STORAGE_KEY = "module4-dashboard:weights";
const TRADES_STORAGE_KEY = "module4-dashboard:trades";
const RANK_EARNED_HOURS_WEIGHT_KEY = "module4-dashboard:rank-earned-hours-weight";
const WEEK_COUNT = 12;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatWeekLabel(weekIso: string): string {
  const d = new Date(`${weekIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return weekIso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function uniqueSortedNumeric(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => Number(a) - Number(b));
}

export default function App() {
  const [trades, setTrades] = useState<string[]>(() => loadFromStorage(TRADES_STORAGE_KEY, DEFAULT_TRADES));
  const [weights, setWeights] = useState<ScorecardWeights>(() => loadFromStorage(WEIGHTS_STORAGE_KEY, DEFAULT_WEIGHTS));
  const [records, setRecords] = useState<WeeklyRecord[]>(() => generateMockData(WEEK_COUNT, trades));
  const [usingImportedData, setUsingImportedData] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [rankBy, setRankBy] = useState<RankByDimension>("supervisor");
  const [rankEarnedHoursWeight, setRankEarnedHoursWeight] = useState<number>(() =>
    loadFromStorage(RANK_EARNED_HOURS_WEIGHT_KEY, 0)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scorecard" | "insights">("scorecard");

  useEffect(() => {
    localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem(RANK_EARNED_HOURS_WEIGHT_KEY, JSON.stringify(rankEarnedHoursWeight));
  }, [rankEarnedHoursWeight]);

  // Keep the sample dataset in sync with the trade list, unless the user has
  // imported their own data.
  useEffect(() => {
    if (!usingImportedData) {
      setRecords(generateMockData(WEEK_COUNT, trades));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, usingImportedData]);

  const allWeeks = useMemo(() => uniqueSorted(records.map((r) => r.week)), [records]);
  const allHulls = useMemo(() => uniqueSorted(records.map((r) => r.hull)), [records]);
  const allModules = useMemo(() => uniqueSortedNumeric(records.map((r) => r.module).filter(Boolean)), [records]);
  const allSupervisors = useMemo(() => uniqueSorted(records.map((r) => r.supervisor)), [records]);
  const allWorkPackages = useMemo(() => uniqueSorted(records.map((r) => r.workPackage)), [records]);
  const filterTradeOptions = useMemo(
    () => uniqueSorted([...trades, ...records.map((r) => r.trade)]),
    [trades, records]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.hulls.length > 0 && !filters.hulls.includes(r.hull)) return false;
      if (filters.modules.length > 0 && !filters.modules.includes(r.module)) return false;
      if (filters.trades.length > 0 && !filters.trades.includes(r.trade)) return false;
      if (filters.supervisors.length > 0 && !filters.supervisors.includes(r.supervisor)) return false;
      if (filters.shifts.length > 0 && !filters.shifts.includes(r.shift)) return false;
      if (filters.workPackages.length > 0 && !filters.workPackages.includes(r.workPackage)) return false;
      if (filters.weekStart && r.week < filters.weekStart) return false;
      if (filters.weekEnd && r.week > filters.weekEnd) return false;
      return true;
    });
  }, [records, filters]);

  const weeksInView = useMemo(() => uniqueSorted(filteredRecords.map((r) => r.week)), [filteredRecords]);
  const latestWeek = weeksInView.length > 0 ? weeksInView[weeksInView.length - 1] : null;

  const summary = useMemo(() => {
    if (!latestWeek) return null;
    const latestWeekRecords = filteredRecords.filter((r) => r.week === latestWeek);
    return aggregateAll(latestWeekRecords, weights);
  }, [filteredRecords, latestWeek, weights]);

  const trendData: WeeklyTrendPoint[] = useMemo(() => {
    const byWeek = new Map<string, WeeklyRecord[]>();
    for (const r of filteredRecords) {
      const arr = byWeek.get(r.week);
      if (arr) arr.push(r);
      else byWeek.set(r.week, [r]);
    }
    const points: WeeklyTrendPoint[] = [];
    for (const week of weeksInView) {
      const bucket = byWeek.get(week);
      if (!bucket) continue;
      const scored = aggregateAll(bucket, weights);
      if (scored) {
        points.push({ ...scored, weekLabel: formatWeekLabel(week) });
      }
    }
    return points;
  }, [filteredRecords, weeksInView, weights]);

  const rankingGroups = useMemo(
    () => groupAndScore(filteredRecords, rankBy, weights, rankEarnedHoursWeight),
    [filteredRecords, rankBy, rankEarnedHoursWeight, weights]
  );

  const selectedModule = filters.modules.length === 1 ? filters.modules[0] : null;

  const scorecardTitle = selectedModule
    ? `Module ${selectedModule} Balanced Scorecard`
    : filters.modules.length > 0
      ? `Modules ${filters.modules.join(", ")} Balanced Scorecard`
      : "Balanced Scorecard — All Modules";

  const moduleRankingGroups = useMemo(() => {
    if (!selectedModule) return null;
    return {
      supervisor: groupAndScore(filteredRecords, "supervisor", weights, rankEarnedHoursWeight),
      trade: groupAndScore(filteredRecords, "trade", weights, rankEarnedHoursWeight),
      shift: groupAndScore(filteredRecords, "shift", weights, rankEarnedHoursWeight),
    };
  }, [filteredRecords, selectedModule, weights, rankEarnedHoursWeight]);

  function handleAddTrade(trade: string) {
    setTrades((prev) => (prev.includes(trade) ? prev : [...prev, trade]));
  }

  function handleRemoveTrade(trade: string) {
    setTrades((prev) => prev.filter((t) => t !== trade));
    setFilters((prev) => ({ ...prev, trades: prev.trades.filter((t) => t !== trade) }));
  }

  function handleImportCsv(imported: WeeklyRecord[]) {
    setRecords(imported);
    setUsingImportedData(true);
    setFilters(EMPTY_FILTERS);
  }

  function handleUseMockData() {
    setUsingImportedData(false);
    setRecords(generateMockData(WEEK_COUNT, trades));
    setFilters(EMPTY_FILTERS);
  }

  return (
    <div className="min-h-screen bg-mck-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          weeks={allWeeks}
          hulls={allHulls}
          modules={allModules}
          trades={filterTradeOptions}
          supervisors={allSupervisors}
          workPackages={allWorkPackages}
          rankBy={rankBy}
          onRankByChange={setRankBy}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex gap-1 border-b border-mck-gray-200">
          {(["scorecard", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-mck-teal text-mck-navy"
                  : "border-b-2 border-transparent text-mck-gray-600 hover:text-mck-navy"
              }`}
            >
              {tab === "scorecard" ? "Scorecard" : "Deeper Insights"}
            </button>
          ))}
        </div>

        {activeTab === "scorecard" ? (
          <>
            <ScorecardSummary
              summary={summary}
              weekLabel={latestWeek ? formatWeekLabel(latestWeek) : ""}
              title={scorecardTitle}
            />

            <TrendCharts data={trendData} />

            {moduleRankingGroups ? (
              <div className="space-y-6">
                <RankingTable
                  groups={moduleRankingGroups.supervisor}
                  dimension="supervisor"
                  rankEarnedHoursWeight={rankEarnedHoursWeight}
                  week={latestWeek}
                />
                <RankingTable
                  groups={moduleRankingGroups.trade}
                  dimension="trade"
                  rankEarnedHoursWeight={rankEarnedHoursWeight}
                  week={latestWeek}
                />
                <RankingTable
                  groups={moduleRankingGroups.shift}
                  dimension="shift"
                  rankEarnedHoursWeight={rankEarnedHoursWeight}
                  week={latestWeek}
                />
              </div>
            ) : (
              <RankingTable
                groups={rankingGroups}
                dimension={rankBy}
                rankEarnedHoursWeight={rankEarnedHoursWeight}
                week={latestWeek}
              />
            )}
          </>
        ) : (
          <InsightsPanel records={filteredRecords} week={latestWeek} />
        )}
      </main>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weights={weights}
        onWeightsChange={setWeights}
        rankEarnedHoursWeight={rankEarnedHoursWeight}
        onRankEarnedHoursWeightChange={setRankEarnedHoursWeight}
        trades={trades}
        onAddTrade={handleAddTrade}
        onRemoveTrade={handleRemoveTrade}
        onImportCsv={handleImportCsv}
        onUseMockData={handleUseMockData}
        usingImportedData={usingImportedData}
      />
    </div>
  );
}
