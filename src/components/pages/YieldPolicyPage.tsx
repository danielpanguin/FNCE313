"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Card from "@/components/ui/Card";
import { computeOverview, BASELINE_MC, DEFAULT_OVERVIEW } from "@/lib/calculations";
import type { OverviewConfig } from "@/types/dashboard";

const TBILL_YIELD = 3.7; // current %
const PRESETS = [
  { label: "No Yield",          yieldBps: 0,   adoptionMult: 1.0 },
  { label: "Activity Rewards",  yieldBps: 80,  adoptionMult: 1.2 },
  { label: "Full Pass-Through", yieldBps: 300, adoptionMult: 2.0 },
];

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-lg font-bold font-mono ${color ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

export default function YieldPolicyPage() {
  const [preset, setPreset] = useState(0);
  const [yieldBps, setYieldBps] = useState(0);
  const [adoptionMult, setAdoptionMult] = useState(1.0);
  const [cfg, setCfg] = useState<OverviewConfig>(DEFAULT_OVERVIEW);

  function applyPreset(i: number) {
    setPreset(i);
    setYieldBps(PRESETS[i].yieldBps);
    setAdoptionMult(PRESETS[i].adoptionMult);
  }

  const baseline = useMemo(() => computeOverview(cfg), [cfg]);
  const withYield = useMemo(() => computeOverview({ ...cfg, projectedMC: cfg.projectedMC * adoptionMult }), [cfg, adoptionMult]);

  const es = baseline.effectiveShare;
  const issuerRevBase   = cfg.projectedMC * es * TBILL_YIELD / 100;
  const yieldPct        = yieldBps / 100;
  const issuerRevPolicy = cfg.projectedMC * adoptionMult * es * Math.max(TBILL_YIELD - yieldPct, 0) / 100;
  const holderRev       = cfg.projectedMC * adoptionMult * es * yieldPct / 100;

  const growthData = useMemo(() => {
    const cagr_base   = Math.pow(cfg.projectedMC / BASELINE_MC, 1 / cfg.horizonYears) - 1;
    const cagr_policy = Math.pow(cfg.projectedMC * adoptionMult / BASELINE_MC, 1 / cfg.horizonYears) - 1;
    return Array.from({ length: cfg.horizonYears + 1 }, (_, y) => ({
      label: y === 0 ? "Now" : `+${y}yr`,
      baseline: +(BASELINE_MC * Math.pow(1 + cagr_base, y)).toFixed(1),
      policy:   +(BASELINE_MC * Math.pow(1 + cagr_policy, y)).toFixed(1),
    }));
  }, [cfg, adoptionMult]);

  const bankDep = 17600;
  const atRisk  = Math.min((yieldPct / 5) * adoptionMult * 3.5, 18);
  const atRiskB = (bankDep * atRisk / 100 / 1000).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Yield Policy Simulator</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Models fiscal impact of yield pass-through to stablecoin holders. Currently prohibited under GENIUS Act §4(c).
          </p>
        </div>
        {/* Policy presets */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(i)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                preset === i ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card title="Policy Controls">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Yield to Holders</span>
                  <span className="text-xs font-mono font-semibold text-violet-600">{yieldPct.toFixed(2)}%</span>
                </div>
                <input type="range" min={0} max={400} step={10} value={yieldBps}
                  onChange={(e) => { setYieldBps(Number(e.target.value)); setPreset(-1); }}
                  className="w-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Adoption Multiplier</span>
                  <span className="text-xs font-mono font-semibold text-violet-600">{adoptionMult.toFixed(1)}×</span>
                </div>
                <input type="range" min={100} max={350} step={5} value={Math.round(adoptionMult * 100)}
                  onChange={(e) => { setAdoptionMult(Number(e.target.value) / 100); setPreset(-1); }}
                  className="w-full accent-violet-600 cursor-pointer" />
              </div>
              <hr className="border-gray-100" />
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
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Horizon</span>
                  <span className="text-xs font-mono font-semibold text-blue-600">{cfg.horizonYears}yr</span>
                </div>
                <input type="range" min={1} max={10} step={1} value={cfg.horizonYears}
                  onChange={(e) => setCfg((c) => ({ ...c, horizonYears: Number(e.target.value) }))}
                  className="w-full accent-blue-600 cursor-pointer" />
              </div>
            </div>
          </Card>

          <Card title="Issuer Economics">
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="No Yield Rev"    value={`$${issuerRevBase.toFixed(1)}B`}   color="text-gray-700" />
              <StatBox label="Policy Rev"      value={`$${issuerRevPolicy.toFixed(1)}B`} color="text-violet-600" />
              <StatBox label="To Holders"      value={`$${holderRev.toFixed(1)}B`}       color="text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card title="Baseline (No Yield)">
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Market Cap"    value={`$${cfg.projectedMC >= 1000 ? (cfg.projectedMC/1000).toFixed(1)+"T" : cfg.projectedMC+"B"}`} />
                <StatBox label="Eff. Demand"   value={`$${baseline.effectiveDemand.toFixed(0)}B`} />
                <StatBox label="Yield Impact"  value={`${baseline.deltaY >= 0 ? "+" : ""}${baseline.deltaY.toFixed(1)} bps`} color="text-emerald-600" />
                <StatBox label="Annual Saving" value={`$${baseline.annualSavings.toFixed(1)}B/yr`} />
              </div>
            </Card>
            <Card title={PRESETS[preset]?.label ?? "Custom Scenario"}>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Market Cap"    value={`$${(cfg.projectedMC * adoptionMult) >= 1000 ? ((cfg.projectedMC*adoptionMult)/1000).toFixed(1)+"T" : (cfg.projectedMC*adoptionMult).toFixed(0)+"B"}`} color="text-violet-600" />
                <StatBox label="Eff. Demand"   value={`$${withYield.effectiveDemand.toFixed(0)}B`}                               color="text-violet-600" />
                <StatBox label="Yield Impact"  value={`${withYield.deltaY >= 0 ? "+" : ""}${withYield.deltaY.toFixed(1)} bps`}   color="text-emerald-600" />
                <StatBox label="Annual Saving" value={`$${withYield.annualSavings.toFixed(1)}B/yr`} />
              </div>
            </Card>
          </div>

          <Card title="Market Cap Trajectory Comparison">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`} width={60} />
                <Tooltip formatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(2)}T` : `$${v}B`} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="baseline" name="No Yield"        stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="policy"   name={PRESETS[preset]?.label ?? "Policy"} stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Deposit flight risk */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-700 mb-2">Deposit Flight Risk</p>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <StatBox label="Est. at Risk" value={`$${atRiskB}T`} sub={`${atRisk.toFixed(1)}% of deposits`} color="text-amber-600" />
              <StatBox label="ABA Worst Case" value="$6.6T" color="text-gray-500" />
              <StatBox label="White House CEA" value="$531B" color="text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              White House CEA (Apr 8, 2026): yield ban protects only $531B in lending (4.4%).
              ABA counters with $6.6T deposit-flight risk. Reality depends on scale — which is exactly what this tool models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
