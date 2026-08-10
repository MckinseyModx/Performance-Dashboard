import type { ReactNode } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoredRecord } from "../types";

export interface WeeklyTrendPoint extends ScoredRecord {
  weekLabel: string;
}

interface TrendChartsProps {
  data: WeeklyTrendPoint[];
}

const MCK = {
  navy: "#051C2C",
  blue: "#2251FF",
  teal: "#00A9CE",
  gold: "#F2A900",
  gray: "#B3B8C4",
  red: "#E34850",
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-mck-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-mck-navy">{title}</h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

export default function TrendCharts({ data }: TrendChartsProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Schedule: Actual vs. Target % Complete">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: MCK.navy }} />
            <YAxis tick={{ fontSize: 11, fill: MCK.navy }} domain={[0, 100]} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="actualPercentComplete" name="Actual %" stroke={MCK.blue} strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="targetPercentComplete"
              name="Target %"
              stroke={MCK.gray}
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Efficiency: Performance Factor (Earned / Actual Hours)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: MCK.navy }} />
            <YAxis tick={{ fontSize: 11, fill: MCK.navy }} domain={[0, 1.5]} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="performanceFactor" name="Performance Factor" stroke={MCK.teal} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Earned Hours per Person">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: MCK.navy }} />
            <YAxis tick={{ fontSize: 11, fill: MCK.navy }} />
            <Tooltip />
            <Line type="monotone" dataKey="earnedHoursPerPerson" name="Earned hrs/person" stroke={MCK.navy} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Composite Score">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: MCK.navy }} />
            <YAxis tick={{ fontSize: 11, fill: MCK.navy }} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="compositeScore" name="Composite" stroke={MCK.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
