import type { ScoredRecord } from "../types";
import { ragForScore } from "../types";

interface ScorecardSummaryProps {
  summary: ScoredRecord | null;
  weekLabel: string;
  title: string;
}

const RAG_STYLES: Record<string, string> = {
  green: "bg-white text-mck-green ring-mck-teal/30 border-l-mck-teal",
  amber: "bg-white text-mck-gold ring-mck-gold/30 border-l-mck-gold",
  red: "bg-white text-mck-red ring-mck-red/30 border-l-mck-red",
};

function ScoreCard({
  title,
  score,
  displayScore,
  detail,
  featured = false,
}: {
  title: string;
  score: number;
  displayScore?: string;
  detail: string;
  featured?: boolean;
}) {
  const value = displayScore ?? score.toFixed(0);

  if (featured) {
    return (
      <div className="rounded-lg border border-mck-gray-200 bg-mck-navy p-4 text-white shadow-sm ring-1 ring-mck-blue/20">
        <div className="text-xs font-medium uppercase tracking-wide text-mck-teal">{title}</div>
        <div className="mt-1 text-3xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-mck-gray-400">{detail}</div>
      </div>
    );
  }

  const rag = ragForScore(score);

  return (
    <div className={`rounded-lg border border-mck-gray-200 border-l-4 bg-white p-4 shadow-sm ring-1 ${RAG_STYLES[rag]}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-mck-gray-600">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-mck-navy">{value}</div>
      <div className="mt-1 text-xs text-mck-gray-600">{detail}</div>
    </div>
  );
}

export default function ScorecardSummary({ summary, weekLabel, title }: ScorecardSummaryProps) {
  if (!summary) {
    return (
      <div className="rounded-lg border border-dashed border-mck-gray-200 bg-white p-6 text-center text-sm text-mck-gray-400">
        No records match the current filters.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-mck-navy">{title}</h2>
        <span className="text-xs text-mck-gray-400">Week of {weekLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <ScoreCard
          featured
          title="Earned Hours"
          score={summary.earnedHours}
          displayScore={summary.earnedHours.toLocaleString()}
          detail={`${summary.earnedHoursPerPerson.toFixed(1)} hrs/person · ${summary.crewSize} people on crew`}
        />
        <ScoreCard title="Composite" score={summary.compositeScore} detail="Weighted balanced scorecard" />
        <ScoreCard
          title="Schedule"
          score={summary.scheduleScore}
          detail={`${summary.actualPercentComplete.toFixed(1)}% vs ${summary.targetPercentComplete.toFixed(1)}% target`}
        />
        <ScoreCard
          title="Efficiency"
          score={summary.efficiencyScore}
          detail={`${(summary.performanceFactor * 100).toFixed(0)}% avg efficiency · PF ${summary.performanceFactor.toFixed(2)}`}
        />
        <ScoreCard
          title="Quality"
          score={summary.qualityScore}
          detail={`${summary.qualityRate.toFixed(0)}% inspections passed`}
        />
        <ScoreCard
          title="Safety"
          score={summary.safetyScore}
          detail={summary.safetyIncidents === 0 ? "Incident-free" : `${summary.safetyIncidents} incident(s)`}
        />
      </div>
    </div>
  );
}
