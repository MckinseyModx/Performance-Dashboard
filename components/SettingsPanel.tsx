import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { ScorecardWeights } from "../types";
import { parseCsv, downloadSampleCsvTemplate } from "../utils/csv";
import type { WeeklyRecord } from "../types";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  weights: ScorecardWeights;
  onWeightsChange: (weights: ScorecardWeights) => void;
  rankEarnedHoursWeight: number;
  onRankEarnedHoursWeightChange: (value: number) => void;
  trades: string[];
  onAddTrade: (trade: string) => void;
  onRemoveTrade: (trade: string) => void;
  onImportCsv: (records: WeeklyRecord[]) => void;
  onUseMockData: () => void;
  usingImportedData: boolean;
}

const WEIGHT_KEYS: { key: keyof ScorecardWeights; label: string; description: string }[] = [
  { key: "schedule", label: "Schedule", description: "% complete vs. plan" },
  { key: "efficiency", label: "Efficiency", description: "Earned hours ÷ actual hours" },
  { key: "quality", label: "Quality", description: "Inspection pass rate" },
  { key: "safety", label: "Safety", description: "Incident-free performance" },
];

export default function SettingsPanel({
  open,
  onClose,
  weights,
  onWeightsChange,
  rankEarnedHoursWeight,
  onRankEarnedHoursWeightChange,
  trades,
  onAddTrade,
  onRemoveTrade,
  onImportCsv,
  onUseMockData,
  usingImportedData,
}: SettingsPanelProps) {
  const [newTrade, setNewTrade] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const totalWeight = weights.schedule + weights.efficiency + weights.quality + weights.safety;

  function handleWeightChange(key: keyof ScorecardWeights, value: number) {
    onWeightsChange({ ...weights, [key]: value });
  }

  function handleAddTrade() {
    const trimmed = newTrade.trim();
    if (trimmed && !trades.includes(trimmed)) {
      onAddTrade(trimmed);
      setNewTrade("");
    }
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { records, errors } = parseCsv(text);
      if (errors.length > 0) {
        setCsvError(errors.join(" "));
      }
      if (records.length > 0) {
        onImportCsv(records);
      }
    };
    reader.onerror = () => setCsvError("Could not read the file.");
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleDownloadTemplate() {
    const csv = downloadSampleCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "module4-dashboard-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <section className="mb-8">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Scorecard weights</h3>
          <p className="mb-3 text-xs text-slate-500">
            How much each perspective counts toward the composite score. Current total: {totalWeight}
            {totalWeight !== 100 && <span className="text-amber-600"> (auto-normalized, doesn't need to equal 100)</span>}
          </p>
          <div className="space-y-4">
            {WEIGHT_KEYS.map(({ key, label, description }) => (
              <div key={key}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-slate-500">{weights[key]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                  className="w-full accent-mck-blue"
                />
                <div className="text-xs text-slate-400">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Ranking</h3>
          <p className="mb-3 text-xs text-slate-500">
            How groups are ordered in the ranking tables. Slide earned hours to 100 to rank purely by total earned
            hours; leave at 0 to rank by composite score.
          </p>
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">Earned hours</span>
              <span className="text-slate-500">{rankEarnedHoursWeight}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={rankEarnedHoursWeight}
              onChange={(e) => onRankEarnedHoursWeightChange(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>Composite score</span>
              <span>Earned hours</span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Trades</h3>
          <p className="mb-3 text-xs text-slate-500">Used as filter options across the dashboard.</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {trades.map((trade) => (
              <span
                key={trade}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {trade}
                <button onClick={() => onRemoveTrade(trade)} className="text-slate-400 hover:text-red-500">
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTrade}
              onChange={(e) => setNewTrade(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTrade()}
              placeholder="Add a trade..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleAddTrade}
              className="rounded-md bg-mck-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-[#051C2C]"
            >
              Add
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Data source</h3>
          <p className="mb-3 text-xs text-slate-500">
            {usingImportedData ? "Currently showing imported CSV data." : "Currently showing sample data."}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Import CSV...
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
            <button onClick={handleDownloadTemplate} className="text-left text-xs text-mck-blue hover:underline">
              Download CSV template
            </button>
            {csvError && <p className="text-xs text-red-600">{csvError}</p>}
            {usingImportedData && (
              <button
                onClick={onUseMockData}
                className="mt-2 text-left text-xs text-slate-500 hover:underline"
              >
                Revert to sample data
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
