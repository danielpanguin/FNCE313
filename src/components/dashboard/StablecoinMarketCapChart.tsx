"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchFiatBackedUSDHistory,
  formatMarketCap,
  fmtDateFromUnix,
  type StablecoinDataPoint,
} from "@/lib/stablecoinApi";
import Card from "@/components/ui/Card";

const RANGES = [
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
  { label: "3Y", days: 1095 },
  { label: "All", days: Infinity },
];

export default function StablecoinMarketCapChart() {
  const [allData, setAllData] = useState<StablecoinDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(730);

  useEffect(() => {
    fetchFiatBackedUSDHistory()
      .then(setAllData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    if (rangeDays === Infinity) return allData;
    const cutoff = Date.now() / 1000 - rangeDays * 86400;
    return allData.filter((d) => d.date >= cutoff);
  }, [allData, rangeDays]);

  // Generate one tick per month (first-of-month unix timestamps) for the visible range
  const monthTicks = useMemo(() => {
    if (data.length === 0) return [];
    const start = new Date(data[0].date * 1000);
    const end = new Date(data[data.length - 1].date * 1000);
    const ticks: number[] = [];
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      ticks.push(d.getTime() / 1000);
      d.setMonth(d.getMonth() + 1);
    }
    return ticks;
  }, [data]);

  const latestValue = data.at(-1)?.totalUSD ?? 0;
  const earliestValue = data.at(0)?.totalUSD ?? 0;
  const change = latestValue - earliestValue;
  const changePct = earliestValue > 0 ? (change / earliestValue) * 100 : 0;

  return (
    <Card title="Fiat-Backed USD Stablecoin Market Cap">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatMarketCap(latestValue)}</p>
          <p className={`text-xs font-medium mt-0.5 ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {change >= 0 ? "▲" : "▼"} {formatMarketCap(Math.abs(change))} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%) over period
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Source: DefiLlama · Daily totals</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                rangeDays === r.days
                  ? "bg-emerald-600 text-white"
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
          Loading stablecoin data… (fetching all fiat-backed coins)
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-72 text-sm text-red-500">
          {error}
        </div>
      )}
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
            <defs>
              <linearGradient id="stablecoinGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={monthTicks}
              tickFormatter={(ts) => {
                const d = new Date(ts * 1000);
                return d.toLocaleString("default", { month: "short", year: "2-digit" });
              }}
              tick={{ fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={formatMarketCap}
              tick={{ fontSize: 11 }}
              width={64}
              domain={["auto", "auto"]}
            />
            <Tooltip
              labelFormatter={(v) => fmtDateFromUnix(Number(v))}
              formatter={(v: unknown) => [formatMarketCap(Number(v)), "Market Cap"]}
              contentStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="totalUSD"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#stablecoinGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
