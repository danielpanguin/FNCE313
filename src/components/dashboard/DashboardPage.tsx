"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import {
  computeOverview,
  computeGrowthTrajectory,
  DEFAULT_OVERVIEW,
  BASELINE_MC,
  formatBillions,
} from "@/lib/calculations";
import type { OverviewConfig } from "@/types/dashboard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const TreasuryYieldChart       = dynamic(() => import("./TreasuryYieldChart"),       { ssr: false });
const StablecoinMarketCapChart = dynamic(() => import("./StablecoinMarketCapChart"),  { ssr: false });

const NET_NEW_TBILL_PER_YR = 433; // $B/yr (TBAC Q1 2026)

function StatCard({
  label, value, sub, accent = "bg-blue-50", valueColor = "text-gray-900",
}: {
  label: string; value: string; sub?: string; accent?: string; valueColor?: string;
}) {
  return (
    <div className={`${accent} rounded-2xl p-5`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [liveMarketCapBillions, setLiveMarketCapBillions] = useState<number | null>(null);
  const [cfg, setCfg] = useState<OverviewConfig>(DEFAULT_OVERVIEW);

  function clampReserves(changed: "direct" | "indirect", val: number) {
    setCfg((c) => {
      let direct   = changed === "direct"   ? val : c.directPct;
      let indirect = changed === "indirect" ? val : c.indirectPct;
      if (direct + indirect > 100) {
        if (changed === "direct")   indirect = 100 - direct;
        else                        direct   = 100 - indirect;
      }
      return { ...c, directPct: Math.max(0, direct), indirectPct: Math.max(0, indirect) };
    });
  }

  const overview = useMemo(() => computeOverview(cfg), [cfg]);
  const growth   = useMemo(() => computeGrowthTrajectory(cfg), [cfg]);

  const netNewSupply = cfg.horizonYears * NET_NEW_TBILL_PER_YR;
  const incDemand    = overview.effectiveDemand - BASELINE_MC * overview.effectiveShare;
  const pctOfSupply  = (incDemand / netNewSupply) * 100;

  const buyerTag =
    pctOfSupply > 100 ? { label: "Dominant Buyer",  color: "bg-red-100 text-red-700"   } :
    pctOfSupply > 50  ? { label: "Growing Buyer",   color: "bg-amber-100 text-amber-700"} :
                        { label: "Minor Buyer",      color: "bg-gray-100 text-gray-600"  };

  return (
    <div className="p-6 space-y-6">
      {/* Live data charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StablecoinMarketCapChart onLatestValue={setLiveMarketCapBillions} />
        <TreasuryYieldChart />
      </div>

      {/* Stat cards — below live charts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Stablecoin Market Cap"    value={liveMarketCapBillions ? `$${liveMarketCapBillions.toFixed(1)}B` : "Loading…"}  sub={liveMarketCapBillions ? "Live · DeFi Llama" : "Fetching…"} />
        <StatCard label="Effective T-Bill Demand"  value={formatBillions(overview.effectiveDemand)}               sub={`At $${cfg.projectedMC >= 1000 ? (cfg.projectedMC/1000).toFixed(1)+"T" : cfg.projectedMC+"B"} projected MC`} accent="bg-emerald-50" />
        <StatCard label="Projected Yield Impact"   value={`${overview.deltaY >= 0 ? "+" : ""}${overview.deltaY.toFixed(1)} bps`} sub="13-week T-bill" accent="bg-amber-50" valueColor={overview.deltaY < 0 ? "text-emerald-600" : "text-red-600"} />
        <StatCard label="Est. Annual Savings"      value={`$${overview.annualSavings.toFixed(1)}B/yr`}             sub="At $6T outstanding" accent="bg-violet-50" />
      </div>

      {/* Overview config + growth trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <Card title="Scenario Configuration">
          <div className="space-y-5">
            {/* Projected MC */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">Projected Market Cap</span>
                <span className="text-xs font-mono font-semibold text-blue-600">
                  ${cfg.projectedMC >= 1000 ? (cfg.projectedMC / 1000).toFixed(1) + "T" : cfg.projectedMC + "B"}
                </span>
              </div>
              <input type="range" min={300} max={5000} step={50} value={cfg.projectedMC}
                onChange={(e) => setCfg((c) => ({ ...c, projectedMC: Number(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" />
            </div>

            <hr className="border-gray-100" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reserve Composition</p>

            {/* Reserve bar visual */}
            <div className="flex h-2.5 rounded-full overflow-hidden border border-gray-200">
              <div className="bg-blue-600 transition-all" style={{ width: `${cfg.directPct}%` }} />
              <div className="bg-blue-300 transition-all" style={{ width: `${cfg.indirectPct}%` }} />
              <div className="bg-gray-100 transition-all" style={{ width: `${100 - cfg.directPct - cfg.indirectPct}%` }} />
            </div>
            <div className="flex gap-4 text-[10px] text-gray-400">
              <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-600 mr-1" />Direct <span className="font-mono text-blue-600">{cfg.directPct}%</span></span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-300 mr-1" />Indirect <span className="font-mono text-blue-400">{cfg.indirectPct}%</span></span>
              <span><span className="inline-block w-2 h-2 rounded-sm bg-gray-200 mr-1" />Other <span className="font-mono text-gray-500">{100 - cfg.directPct - cfg.indirectPct}%</span></span>
            </div>

            {[
              { label: "Direct T-Bill Reserve", key: "direct" as const, val: cfg.directPct },
              { label: "Indirect T-Linked",     key: "indirect" as const, val: cfg.indirectPct },
            ].map(({ label, key, val }) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className="text-xs font-mono font-semibold text-blue-600">{val}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={val}
                  onChange={(e) => clampReserves(key, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" />
              </div>
            ))}

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">Look-Through Rate</span>
                <span className="text-xs font-mono font-semibold text-blue-600">{cfg.lookThrough}%</span>
              </div>
              <input type="range" min={40} max={100} step={5} value={cfg.lookThrough}
                onChange={(e) => setCfg((c) => ({ ...c, lookThrough: Number(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600">Projection Horizon</span>
                <span className="text-xs font-mono font-semibold text-blue-600">{cfg.horizonYears}yr</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={cfg.horizonYears}
                onChange={(e) => setCfg((c) => ({ ...c, horizonYears: Number(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" />
            </div>
          </div>
        </Card>

        {/* Growth trajectory — stretches to match config card height */}
        <div className="lg:col-span-2 flex flex-col">
          <Card title="Growth Trajectory" className="flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <LineChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`} width={60} />
                  <Tooltip formatter={(v: unknown) => { const n = Number(v); return n >= 1000 ? `$${(n/1000).toFixed(2)}T` : `$${n.toFixed(0)}B`; }} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="mc"     name="Market Cap"         stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="demand" name="Eff. T-Bill Demand" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>


      {/* Marginal buyer analysis */}
      <Card title="Marginal Buyer Analysis">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs text-gray-400 flex-1">
            Incremental T-bill demand vs estimated net new supply over projection horizon.
            Net new T-bill supply ~$433B/yr (TBAC Q1 2026). Foreign and MMF estimates based on historical absorption ranges.
          </p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${buyerTag.color}`}>
            {buyerTag.label}
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            { label: "Net New Supply",              val: netNewSupply,               color: "bg-gray-300",   pct: 100          },
            { label: "Foreign CBs (~$75–125B/yr)",  val: 100 * cfg.horizonYears,     color: "bg-slate-400",  pct: (100*cfg.horizonYears)/netNewSupply*100 },
            { label: "Money Mkt (~$100–150B/yr)",   val: 125 * cfg.horizonYears,     color: "bg-slate-500",  pct: (125*cfg.horizonYears)/netNewSupply*100 },
            { label: "Stablecoins",                 val: incDemand,                  color: "bg-blue-500",   pct: pctOfSupply  },
          ].map(({ label, val, color, pct }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-36 text-right shrink-0">{label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full ${color} rounded flex items-center px-2 transition-all`}
                  style={{ width: `${Math.min(pct, 100)}%`, minWidth: "60px" }}
                >
                  <span className="text-[10px] font-mono font-semibold text-white whitespace-nowrap">
                    {val >= 1000 ? `$${(val/1000).toFixed(1)}T` : `$${val.toFixed(0)}B`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pctOfSupply > 0 && (
          <p className={`mt-4 text-xs leading-relaxed px-3 py-2.5 rounded-lg ${
            pctOfSupply > 100
              ? "bg-red-50 text-red-700 border-l-4 border-red-500"
              : "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
          }`}>
            {pctOfSupply > 100
              ? `At $${cfg.projectedMC >= 1000 ? (cfg.projectedMC/1000).toFixed(1)+"T" : cfg.projectedMC+"B"}, stablecoins absorb ${pctOfSupply.toFixed(0)}% of net new T-bill supply — exceeding total issuance. Treasury must expand front-end supply. Stablecoins become the price-setting marginal buyer.`
              : `At $${cfg.projectedMC >= 1000 ? (cfg.projectedMC/1000).toFixed(1)+"T" : cfg.projectedMC+"B"}, stablecoins absorb ${pctOfSupply.toFixed(0)}% of projected ${cfg.horizonYears}-year net new T-bill supply.`
            }
          </p>
        )}
      </Card>

      {/* Model Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Long-Run Structural Model">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-blue-600 mb-4">
            <p className="text-[10px] text-gray-400 font-sans mb-1">Ahmed &amp; Aldasoro — BIS WP 1270 (2025)</p>
            ΔY = 100 × β × ln(S_new / S₀) × (1/λ) × (r / 0.72)
          </div>
          <div className="space-y-1.5">
            {[
              ["β (13-week)",   "−2.9858",       "text-emerald-700"],
              ["S₀ (baseline)", "$300.8B",        "text-gray-700"],
              ["λ (attenuation)", "50",           "text-gray-700"],
              ["r_baseline",    "0.72 (72%)",     "text-gray-700"],
              ["Effect horizon","≤ 13 weeks",     "text-gray-700"],
            ].map(([k, v, c]) => (
              <div key={k as string} className="flex justify-between text-xs">
                <span className="text-gray-500">{k}</span>
                <span className={`font-mono font-semibold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100 pt-2">
            Captures a permanent yield shift. Log specification gives diminishing returns — each doubling of market cap adds the same bps compression.
          </p>
        </Card>

        <Card title="Short-Run Flow Model">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-blue-600 mb-4">
            <p className="text-[10px] text-gray-400 font-sans mb-1">Ahmed &amp; Aldasoro — BIS WP 1270 (2025)</p>
            ΔY = α × Flow × (T_ref / T_exec) × (r / 0.60)
          </div>
          <div className="space-y-1.5">
            {[
              ["α Normal",    "0.714 bps/$1B",  "text-emerald-600"],
              ["α Scarcity",  "1.429 bps/$1B",  "text-amber-600"],
              ["α Crisis",    "2.143 bps/$1B",  "text-red-600"],
              ["T_ref",       "5 days",         "text-gray-700"],
              ["r_embedded",  "0.60 (60%)",     "text-gray-700"],
            ].map(([k, v, c]) => (
              <div key={k as string} className="flex justify-between text-xs">
                <span className="text-gray-500">{k}</span>
                <span className={`font-mono font-semibold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100 pt-2">
            Short-lived effect — fades after execution. Positive ΔY = yields rise (sell pressure). SVB precedent: $3.3B shock → tens of bps spike.
          </p>
        </Card>
      </div>
    </div>
  );
}
