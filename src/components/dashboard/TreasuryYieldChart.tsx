"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchTreasuryYields,
  TRACKED_SECURITIES,
  SECURITY_COLORS,
  SECURITY_SHORT,
  type YieldDataPoint,
} from "@/lib/treasuryApi";
import Card from "@/components/ui/Card";

const RANGES = [
  { label: "1Y", months: 12 },
  { label: "2Y", months: 24 },
  { label: "3Y", months: 36 },
  { label: "5Y", months: 60 },
];

function subtractMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short" })} '${year.slice(2)}`;
}

export default function TreasuryYieldChart() {
  const [data, setData] = useState<YieldDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeMonths, setRangeMonths] = useState(24);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTreasuryYields(subtractMonths(rangeMonths))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [rangeMonths]);

  return (
    <Card title="US Treasury Average Interest Rates">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">Source: US Treasury Fiscal Data API · Monthly averages</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRangeMonths(r.months)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                rangeMonths === r.months
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-72 text-sm text-gray-400">
          Loading Treasury data…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-72 text-sm text-red-500">
          {error}
        </div>
      )}
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              width={48}
              domain={["auto", "auto"]}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((v: unknown, name: unknown) =>
                [`${Number(v).toFixed(3)}%`, SECURITY_SHORT[String(name ?? "")] ?? String(name ?? "")]) as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={((label: unknown) => fmtDate(String(label))) as any}
              contentStyle={{ fontSize: 12 }}
            />
            {TRACKED_SECURITIES.map((sec) => (
              <Line
                key={sec}
                type="monotone"
                dataKey={sec}
                stroke={SECURITY_COLORS[sec]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
