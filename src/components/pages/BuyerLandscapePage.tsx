"use client";

import { useState, useEffect } from "react";
import { fetchFredLatest, FRED_SERIES } from "@/lib/fredApi";
import ParamTooltip from "@/components/ui/ParamTooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import Card from "@/components/ui/Card";
import { BASELINE_MC } from "@/lib/calculations";

const STATIC_BUYERS = [
  { name: "Money Mkt Funds", value: 3000 },
  { name: "Foreign CBs",     value: 2100 },
  { name: "Japan",           value: 1230 },
  { name: "UK",              value: 895  },
  { name: "China",           value: 694  },
  { name: "Comm. Banks",     value: 700  },
];

const FINDINGS = [
  {
    title: "Yield Compression",
    body: "As stablecoin market cap grows, structural T-bill demand compresses front-end yields — permanently, as long as the market stays at its new size.",
    color: "border-emerald-500 bg-emerald-50",
    titleColor: "text-emerald-700",
  },
  {
    title: "Marginal Buyer Status",
    body: "At $1T+ market cap, stablecoins become a dominant front-end buyer — absorbing a significant fraction of net new T-bill issuance each year.",
    color: "border-blue-500 bg-blue-50",
    titleColor: "text-blue-700",
  },
  {
    title: "Asymmetric Risk",
    body: "Yield compression is gradual; reversal is violent. A 10% redemption shock under crisis conditions can spike yields by hundreds of basis points.",
    color: "border-red-500 bg-red-50",
    titleColor: "text-red-700",
  },
  {
    title: "Policy Sensitivity",
    body: "If yield passes through to holders, adoption could accelerate significantly. Standard Chartered estimates a 1.42× uplift to $500B under full pass-through. The yield prohibition is a fiscal policy choice disguised as consumer protection.",
    color: "border-violet-500 bg-violet-50",
    titleColor: "text-violet-700",
  },
];

export default function BuyerLandscapePage() {
  const [projectedMC, setProjectedMC] = useState(948);
  const [mmfAssets, setMmfAssets]     = useState(3000); // $B, live from FRED WRMFNS
  const [mmfDate, setMmfDate]         = useState<string | null>(null);

  useEffect(() => {
    fetchFredLatest(FRED_SERIES.MMF_ASSETS)
      .then((d) => { setMmfAssets(d.value); setMmfDate(d.date); })
      .catch(() => { /* keep fallback */ });
  }, []);

  const effDemand = projectedMC * 0.79; // ~79% reserve share

  const chartData = [
    { name: "Money Mkt Funds", value: Math.round(mmfAssets) },
    ...STATIC_BUYERS.filter((b) => b.name !== "Money Mkt Funds"),
    { name: "Stablecoins (Now)",       value: Math.round(BASELINE_MC * 0.79) },
    { name: "Stablecoins (Projected)", value: Math.round(effDemand)           },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">T-Bill Buyer Landscape</h1>
        <p className="text-sm text-gray-500 mt-0.5">Where stablecoins fit in the $6T front-end Treasury market</p>
      </div>

      <Card title="T-Bill Holdings by Buyer ($B)">
        {mmfDate && (
          <p className="text-[10px] text-gray-400 mb-3">
            Money Mkt Funds: <span className="font-mono font-semibold text-emerald-600">${mmfAssets.toFixed(0)}B</span>
            <span className="ml-1">· Live · FRED WRMFNS ({mmfDate})</span>
          </p>
        )}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-600 inline-flex items-center">Stablecoin Projected Market Cap<ParamTooltip text="Projected total USD stablecoin market cap. Scales the stablecoin T-bill demand bar relative to other buyers. ~79% of market cap flows into T-bill reserves under GENIUS Act mandates." /></span>
            <span className="text-xs font-mono font-semibold text-blue-600">
              ${projectedMC >= 1000 ? (projectedMC / 1000).toFixed(1) + "T" : projectedMC + "B"}
            </span>
          </div>
          <input type="range" min={300} max={4000} step={50} value={projectedMC}
            onChange={(e) => setProjectedMC(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer" />
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
            <Tooltip formatter={(v: unknown) => { const n = Number(v); return n >= 1000 ? `$${(n/1000).toFixed(2)}T` : `$${n}B`; }} contentStyle={{ fontSize: 12 }} />
            {chartData.map((_, i) => (
              <Cell key={i} fill={
                i === chartData.length - 1 ? "rgba(59,130,246,0.55)" :
                i === chartData.length - 2 ? "rgba(59,130,246,0.25)" :
                "#e2e8f0"
              } />
            ))}
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={
                  i === chartData.length - 1 ? "rgba(59,130,246,0.55)" :
                  i === chartData.length - 2 ? "rgba(59,130,246,0.25)" :
                  "#e2e8f0"
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Gold vs Dollar Stablecoins">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {["Dimension", "Dollar Stablecoins", "Gold Stablecoins"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Market Cap",       "$314B+",                  "$4.6B (1.5%)"],
                  ["Primary Use",      "Payments, settlement, DeFi", "Store of value, inflation hedge"],
                  ["Reserve Mandate",  "100% T-bills/cash (GENIUS)", "Excluded (commodity-backed)"],
                  ["T-Bill Demand",    "Structural buyer",         "Zero"],
                  ["Growth Driver",    "Adoption (50–60% CAGR)",   "Gold price (~25% CAGR)"],
                ].map(([dim, usd, gold], i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500">{dim}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{usd}</td>
                    <td className="py-2.5 px-3 text-amber-600">{gold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
            Gold stablecoins exist in a separate regulatory framework. The relevant competition for dollar stablecoins is{" "}
            <strong>bank deposits and money market funds</strong>, not gold.
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Key Findings</h3>
          {FINDINGS.map((f) => (
            <div key={f.title} className={`border-l-4 rounded-r-xl p-4 ${f.color}`}>
              <p className={`text-xs font-bold mb-1 ${f.titleColor}`}>{f.title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
