import type { Filters, RankByDimension } from "../types";
import MultiSelect from "./MultiSelect";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (next: Filters) => void;
  weeks: string[];
  hulls: string[];
  modules: string[];
  trades: string[];
  supervisors: string[];
  workPackages: string[];
  rankBy: RankByDimension;
  onRankByChange: (dim: RankByDimension) => void;
  onOpenSettings: () => void;
}

const RANK_OPTIONS: { value: RankByDimension; label: string }[] = [
  { value: "supervisor", label: "Supervisor" },
  { value: "crew", label: "Crew" },
  { value: "trade", label: "Trade" },
  { value: "shift", label: "Shift" },
  { value: "hull", label: "Boat" },
  { value: "module", label: "Module" },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  weeks,
  hulls,
  modules,
  trades,
  supervisors,
  workPackages,
  rankBy,
  onRankByChange,
  onOpenSettings,
}: FilterBarProps) {
  function patch(partial: Partial<Filters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const hasActiveFilters =
    filters.hulls.length > 0 ||
    filters.modules.length > 0 ||
    filters.trades.length > 0 ||
    filters.supervisors.length > 0 ||
    filters.shifts.length > 0 ||
    filters.workPackages.length > 0 ||
    filters.weekStart !== null ||
    filters.weekEnd !== null;

  const selectedModule = filters.modules.length === 1 ? filters.modules[0] : null;
  const moduleFocusMode = selectedModule !== null;

  return (
    <div className="rounded-lg border border-mck-gray-200 bg-white p-4 shadow-sm">
      {moduleFocusMode && (
        <p className="mb-3 text-sm text-mck-gray-600">
          Viewing <span className="font-semibold text-mck-navy">Module {selectedModule}</span> — scorecard and
          supervisor, trade, and shift rankings below.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelect label="Boat" options={hulls} selected={filters.hulls} onChange={(v) => patch({ hulls: v })} />
        <div>
          <label className="mb-1 block text-xs font-medium text-mck-gray-600">Module</label>
          <select
            className="min-w-[9rem] rounded-md border border-mck-gray-200 bg-white px-3 py-1.5 text-sm text-mck-navy shadow-sm focus:border-mck-blue focus:outline-none focus:ring-1 focus:ring-mck-blue"
            value={filters.modules[0] ?? ""}
            onChange={(e) => patch({ modules: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">All modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                Module {module}
              </option>
            ))}
          </select>
        </div>
        <MultiSelect label="Trade" options={trades} selected={filters.trades} onChange={(v) => patch({ trades: v })} />
        <MultiSelect
          label="Supervisor"
          options={supervisors}
          selected={filters.supervisors}
          onChange={(v) => patch({ supervisors: v })}
        />
        <MultiSelect
          label="Shift"
          options={["Day", "Night"]}
          selected={filters.shifts}
          onChange={(v) => patch({ shifts: v })}
        />
        <MultiSelect
          label="Work Package"
          options={workPackages}
          selected={filters.workPackages}
          onChange={(v) => patch({ workPackages: v })}
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-mck-gray-600">From week</label>
          <select
            className="rounded-md border border-mck-gray-200 bg-white px-3 py-1.5 text-sm text-mck-navy shadow-sm"
            value={filters.weekStart ?? ""}
            onChange={(e) => patch({ weekStart: e.target.value || null })}
          >
            <option value="">Earliest</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-mck-gray-600">To week</label>
          <select
            className="rounded-md border border-mck-gray-200 bg-white px-3 py-1.5 text-sm text-mck-navy shadow-sm"
            value={filters.weekEnd ?? ""}
            onChange={(e) => patch({ weekEnd: e.target.value || null })}
          >
            <option value="">Latest</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {!moduleFocusMode && (
          <div>
            <label className="mb-1 block text-xs font-medium text-mck-gray-600">Rank by</label>
            <select
              className="rounded-md border border-mck-gray-200 bg-white px-3 py-1.5 text-sm text-mck-navy shadow-sm"
              value={rankBy}
              onChange={(e) => onRankByChange(e.target.value as RankByDimension)}
            >
              {RANK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() =>
                onFiltersChange({
                  hulls: [],
                  modules: [],
                  trades: [],
                  supervisors: [],
                  shifts: [],
                  workPackages: [],
                  weekStart: null,
                  weekEnd: null,
                })
              }
              className="rounded-md px-3 py-1.5 text-sm text-mck-gray-600 hover:text-mck-navy hover:underline"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="rounded-md border border-mck-gray-200 bg-mck-gray-50 px-3 py-1.5 text-sm font-medium text-mck-navy hover:bg-mck-gray-100"
          >
            ⚙ Settings
          </button>
        </div>
      </div>
    </div>
  );
}
