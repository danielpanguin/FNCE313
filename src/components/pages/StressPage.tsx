"use client";

import { useState, useMemo, useEffect } from "react";
import { fetchFredLatest, FRED_SERIES } from "@/lib/fredApi";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import ParamTooltip from "@/components/ui/ParamTooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const ALPHA = { normal: 0.714, scarcity: 1.429, crisis: 2.143 };
const OUTFLOWS = [0.02, 0.05, 0.10, 0.20, 0.30];
const BASELINE_MC = 300.8;

function bpsColor(v: number) {
  if (v > 200) return "text-red-600 font-bold";
  if (v > 50)  return "text-amber-600 font-semibold";
  return "text-emerald-600";
}

export default function StressPage() {
  const [mc, setMc]         = useState(1200);
  const [execDays, setExecDays]   = useState(5);
  const [reservePct, setReservePct] = useState(80);
  const [rrp, setRrp]       = useState<number | null>(null);
  const [rrpDate, setRrpDate] = useState<string | null>(null);

  useEffect(() => {
    fetchFredLatest(FRED_SERIES.RRP_BALANCE)
      .then((d) => { setRrp(d.value); setRrpDate(d.date); })
      .catch(() => { /* optional indicator, keep null */ });
  }, []);

  const rrpCondition = rrp === null ? null
    : rrp > 500  ? { label: "Scarcity likely",  color: "text-amber-600" }
    : rrp > 100  ? { label: "Normal likely",    color: "text-emerald-600" }
    :              { label: "Crisis-adjacent",  color: "text-red-600" };

  const tRatio = Math.min(5 / execDays, 5.0);
  const rRatio = (reservePct / 100) / 0.60;

  const rows = useMemo(() =>
    OUTFLOWS.map((pct) => {
      const flow = mc * pct;
      return {
        pct,
        flow,
        normal:   ALPHA.normal   * flow * tRatio * rRatio,
        scarcity: ALPHA.scarcity * flow * tRatio * rRatio,
        crisis:   ALPHA.crisis   * flow * tRatio * rRatio,
      };
    }),
  [mc, tRatio, rRatio]);

  const svbX = ((mc * 0.08) / 3.3).toFixed(0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Stress Testing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Short-run yield impact under stablecoin redemption shocks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card title="Shock Parameters">
            <div className="space-y-5">
              {/* MC */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600 inline-flex items-center">Market Cap at Shock<ParamTooltip text="Total stablecoin market cap at the moment the redemption shock occurs. A larger market means a proportionally larger absolute outflow for the same percentage shock." /></span>
                  <span className="text-xs font-mono font-semibold text-blue-600">
                    ${mc >= 1000 ? (mc / 1000).toFixed(1) + "T" : mc + "B"}
                  </span>
                </div>
                <input type="range" min={300} max={4000} step={50} value={mc}
                  onChange={(e) => setMc(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" />
              </div>
              {/* Exec days */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600 inline-flex items-center">Execution Speed<ParamTooltip text="How quickly issuers liquidate T-bill reserves to meet redemptions. Faster execution (fewer days) amplifies yield impact — the urgency factor T_ref/T_exec is capped at 5×." /></span>
                  <span className="text-xs font-mono font-semibold text-blue-600">{execDays} day{execDays !== 1 ? "s" : ""}</span>
                </div>
                <input type="range" min={1} max={20} step={1} value={execDays}
                  onChange={(e) => setExecDays(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>1 day (panic)</span><span>20 days (orderly)</span>
                </div>
              </div>
              {/* Reserve */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600 inline-flex items-center">T-Bill Reserve Share<ParamTooltip text="Percentage of stablecoin reserves held in T-bills. Higher share means more T-bills must be sold under stress, increasing yield impact. Baseline is 60% (2021–2025 average)." /></span>
                  <span className="text-xs font-mono font-semibold text-blue-600">{reservePct}%</span>
                </div>
                <input type="range" min={40} max={100} step={5} value={reservePct}
                  onChange={(e) => setReservePct(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" />
              </div>
            </div>
          </Card>

          <Card title="Short-Run Flow Model">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-blue-600 mb-3">
              <p className="text-[10px] text-gray-400 font-sans mb-1">Ahmed &amp; Aldasoro — BIS WP 1270</p>
              ΔY = α × ΔMC × (5/T) × (r / 0.60)
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                ["α (Normal)",   "0.714 bps/$1B", "text-emerald-600"],
                ["α (Scarcity)", "1.429 bps/$1B", "text-amber-600"],
                ["α (Crisis)",   "2.143 bps/$1B", "text-red-600"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-mono font-semibold ${c}`}>{v}</span>
                </div>
              ))}
            </div>
            {rrp !== null && rrpCondition && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">RRP Balance · Live FRED</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    ${rrp.toFixed(0)}B
                    {rrpDate && <span className="ml-1 text-gray-400">({rrpDate})</span>}
                  </span>
                  <span className={`text-xs font-semibold ${rrpCondition.color}`}>{rrpCondition.label}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  RRP draining → normal; RRP elevated → scarcity; near zero + stress → crisis.
                </p>
              </div>
            )}
          </Card>

          {/* SVB reference */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
            <p className="text-xs font-bold text-red-600 mb-1">SVB / USDC Depeg — Mar 2023</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              $3.3B exposed → USDC hit $0.87 → short-end T-bill yields moved sharply higher by roughly tens of basis points.
              At current scale, an equivalent shock is{" "}
              <strong className="text-red-600">{svbX}×</strong> larger.
            </p>
          </div>
        </div>

        {/* Matrix + Chart */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Outflow Stress Matrix">
            <p className="text-xs text-gray-400 mb-3">Yield impact in bps. Positive = yields rise (sell pressure).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Outflow</th>
                    <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Flow ($B)</th>
                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Normal</th>
                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-amber-600">Scarcity</th>
                    <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-red-600">Crisis</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.pct} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-700">{(r.pct * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-3 font-mono text-gray-600">${r.flow.toFixed(0)}B</td>
                      <td className={`py-2.5 px-3 text-center font-mono ${bpsColor(r.normal)}`}>+{r.normal.toFixed(1)}</td>
                      <td className={`py-2.5 px-3 text-center font-mono ${bpsColor(r.scarcity)}`}>+{r.scarcity.toFixed(1)}</td>
                      <td className={`py-2.5 px-3 text-center font-mono ${bpsColor(r.crisis)}`}>+{r.crisis.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Stress Visualisation">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rows.map((r) => ({ name: `${(r.pct * 100).toFixed(0)}%`, normal: +r.normal.toFixed(1), scarcity: +r.scarcity.toFixed(1), crisis: +r.crisis.toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} bps`} width={64} />
                <Tooltip formatter={(v) => [`${v} bps`]} contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="normal"   name="Normal"   stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="scarcity" name="Scarcity" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="crisis"   name="Crisis"   stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
