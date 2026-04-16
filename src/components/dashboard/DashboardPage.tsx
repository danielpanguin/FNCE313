"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import ParamTooltip from "@/components/ui/ParamTooltip";
import {
  computeOverview,
  computeGrowthTrajectory,
  DEFAULT_OVERVIEW,
  BASELINE_MC,
  formatBillions,
} from "@/lib/calculations";
import type { OverviewConfig } from "@/types/dashboard";
import { fetchFredHistory, FRED_SERIES } from "@/lib/fredApi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const TreasuryYieldChart       = dynamic(() => import("./TreasuryYieldChart"),       { ssr: false });
const StablecoinMarketCapChart = dynamic(() => import("./StablecoinMarketCapChart"),  { ssr: false });

const NET_NEW_TBILL_FALLBACK = 433; // $B/yr fallback (TBAC Q1 2026)


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
  const [tbillOut, setTbillOut]         = useState(6000);   // $B outstanding, live from FRED
  const [netNewTbill, setNetNewTbill]   = useState(NET_NEW_TBILL_FALLBACK); // $B/yr
  const [fredTbillDate, setFredTbillDate] = useState<string | null>(null);

  useEffect(() => {
    // WMTSNS: T-bills outstanding weekly ($M). Fetch 60 obs (~1yr) for outstanding + YoY net new.
    fetchFredHistory(FRED_SERIES.TBILL_OUT, 60)
      .then((obs) => {
        if (obs.length === 0) return;
        const latestB = obs[0].value / 1000; // $M → $B
        setTbillOut(latestB);
        setFredTbillDate(obs[0].date);
        setCfg((c) => ({ ...c, tbillOutBillions: latestB }));
        if (obs.length >= 52) {
          const yearAgoB = obs[51].value / 1000;
          setNetNewTbill(+(latestB - yearAgoB).toFixed(0));
        }
      })
      .catch(() => { /* silently keep fallback */ });
  }, []);

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

  const netNewSupply = cfg.horizonYears * netNewTbill;
  const incDemand    = overview.effectiveDemand - BASELINE_MC * overview.effectiveShare;
  const pctOfSupply  = (incDemand / netNewSupply) * 100;

  const buyerTag =
    pctOfSupply > 100 ? { label: "Dominant Buyer",  color: "bg-red-100 text-red-700"   } :
    pctOfSupply > 50  ? { label: "Growing Buyer",   color: "bg-amber-100 text-amber-700"} :
                        { label: "Minor Buyer",      color: "bg-gray-100 text-gray-600"  };

  return (
    <div className="p-6 space-y-8">
      {/* ── Market Data ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Market Data</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">Live stablecoin market cap and US Treasury bill yields</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StablecoinMarketCapChart onLatestValue={setLiveMarketCapBillions} />
          <TreasuryYieldChart />
        </div>
      </section>

      {/* ── Key Metrics ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Key Metrics</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">Projected T-bill demand, yield impact, and annual savings at the configured scenario</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Stablecoin Market Cap"    value={liveMarketCapBillions ? `$${liveMarketCapBillions.toFixed(1)}B` : "Loading…"}  sub={liveMarketCapBillions ? "Live · DeFi Llama" : "Fetching…"} />
        <StatCard label="Effective T-Bill Demand"  value={formatBillions(overview.effectiveDemand)}               sub={`At $${cfg.projectedMC >= 1000 ? (cfg.projectedMC/1000).toFixed(1)+"T" : cfg.projectedMC+"B"} projected MC`} accent="bg-emerald-50" />
        <StatCard label="Projected Yield Impact"   value={`${overview.deltaY >= 0 ? "+" : ""}${overview.deltaY.toFixed(1)} bps`} sub="13-week T-bill" accent="bg-amber-50" valueColor={overview.deltaY < 0 ? "text-emerald-600" : "text-red-600"} />
        <StatCard label="Est. Annual Savings"      value={`$${overview.annualSavings.toFixed(1)}B/yr`}             sub={fredTbillDate ? `At $${tbillOut.toFixed(0)}B outstanding · FRED` : "At $6T outstanding"} accent="bg-violet-50" />
        </div>
      </section>

      {/* ── Scenario Analysis ───────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Long Run Scenario Analysis</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">Configure reserve composition and projection horizon to model structural yield compression</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <Card title="Scenario Configuration">
          <div className="space-y-5">
            {/* Projected MC */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600 inline-flex items-center">Projected Market Cap<ParamTooltip text="Total USD stablecoin market cap at the end of the horizon. Drives effective T-bill demand and long-run yield compression." /></span>
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
              { label: "Direct T-Bill Reserve", tooltip: "Share of reserves held directly in Treasury bills, as mandated under GENIUS Act §4(a). Counts 1-for-1 toward effective T-bill demand.", key: "direct" as const, val: cfg.directPct },
              { label: "Indirect T-Linked",     tooltip: "Share held in instruments with T-bill exposure (e.g. money market funds, repo). Subject to the look-through discount below.", key: "indirect" as const, val: cfg.indirectPct },
            ].map(({ label, tooltip, key, val }) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600 inline-flex items-center">{label}<ParamTooltip text={tooltip} /></span>
                  <span className="text-xs font-mono font-semibold text-blue-600">{val}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={val}
                  onChange={(e) => clampReserves(key, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" />
              </div>
            ))}

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600 inline-flex items-center">Look-Through Rate<ParamTooltip text="Fraction of indirect T-linked holdings that translate into actual T-bill demand. 80% means $0.80 of every $1 in indirect reserves reaches the T-bill market." /></span>
                <span className="text-xs font-mono font-semibold text-blue-600">{cfg.lookThrough}%</span>
              </div>
              <input type="range" min={40} max={100} step={5} value={cfg.lookThrough}
                onChange={(e) => setCfg((c) => ({ ...c, lookThrough: Number(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-600 inline-flex items-center">Projection Horizon<ParamTooltip text="Number of years over which market cap growth is projected. Affects CAGR calculation, net new T-bill supply, and marginal buyer analysis." /></span>
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
      </section>

      {/* ── Marginal Buyer Analysis ─────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Marginal Buyer Analysis</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">Stablecoin incremental T-bill demand relative to estimated net new supply over the projection horizon</p>
        <Card title="Marginal Buyer Analysis">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs text-gray-400 flex-1">
            Incremental T-bill demand vs estimated net new supply over projection horizon.
            Net new T-bill supply ~${netNewTbill.toFixed(0)}B/yr{fredTbillDate ? ` · Live FRED WMTSNS (${fredTbillDate})` : " (TBAC Q1 2026)"}. Foreign and MMF estimates based on historical absorption ranges.
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
      </section>
    </div>
  );
}
