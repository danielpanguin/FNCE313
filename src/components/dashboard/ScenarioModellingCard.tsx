"use client";

import { useState } from "react";
import type { Scenario, ReserveComposition } from "@/types/dashboard";
import { DEFAULT_SCENARIOS, DEFAULT_RESERVES } from "@/lib/calculations";
import { computeShortRun, computeLongRun, SHORT_RUN_ALPHA } from "@/lib/scenarioModels";

const CURRENT_TBILL_YIELD = 3.7; // 3-month T-bill yield, % (hardcoded)

// ─── Result Column ─────────────────────────────────────────────────────────────

function ResultColumn({
  scenarioLabel,
  deltaY,
  rows,
}: {
  scenarioLabel: string;
  deltaY: number;
  rows: { label: string; value: string }[];
}) {
  const isCompression = deltaY < 0;
  const color  = isCompression ? "text-emerald-600" : "text-red-500";
  const bg     = isCompression ? "bg-emerald-50"    : "bg-red-50";
  const border = isCompression ? "border-emerald-200" : "border-red-200";
  const resultingYield = CURRENT_TBILL_YIELD + deltaY / 100;

  return (
    <div className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-3 flex-1 min-w-0`}>
      <p className="text-sm font-bold text-gray-800">{scenarioLabel}</p>

      {/* Resulting yield */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Resulting T-Bill Yield</p>
        <p className={`text-3xl font-bold font-mono ${color}`}>
          {resultingYield.toFixed(3)}
          <span className="text-sm ml-1">%</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {CURRENT_TBILL_YIELD.toFixed(1)}% base &nbsp;
          <span className={color}>
            {deltaY >= 0 ? "+" : ""}{deltaY.toFixed(2)} bps
          </span>
        </p>
      </div>

      <div className="border-t border-current border-opacity-10 pt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-xs gap-2">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-mono font-semibold text-gray-700 text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scenarios Panel ───────────────────────────────────────────────────────────

function ScenariosPanel({
  scenarios,
  onScenariosChange,
}: {
  scenarios: Scenario[];
  activeScenarioId?: string;
  onScenariosChange: (s: Scenario[]) => void;
  onActiveChange?: (id: string) => void;
}) {
  function updateMarketCap(id: string, value: number) {
    onScenariosChange(scenarios.map((s) => (s.id === id ? { ...s, marketCapBillions: value } : s)));
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Stablecoin Demand Scenarios</p>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
            <span className="flex-1 text-sm font-medium text-gray-800">{s.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">$</span>
              <input
                type="number"
                min={0}
                className="w-20 text-sm text-right border border-gray-200 rounded-md px-2 py-0.5 outline-none focus:border-blue-400 text-gray-800 font-mono"
                value={s.marketCapBillions}
                onChange={(e) => updateMarketCap(s.id, parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-gray-400">B</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reserve Panel ─────────────────────────────────────────────────────────────

function ReservePanel({
  reserves,
  onChange,
}: {
  reserves: ReserveComposition;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Reserve Composition</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Direct &amp; Indirect Treasury Holdings</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(reserves.treasuryPct)}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              className="w-14 text-sm text-right border border-gray-200 rounded-md px-2 py-0.5 outline-none focus:border-blue-400 font-mono"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={reserves.treasuryPct}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-blue-600"
        />
        <p className="text-xs text-gray-400">
          Historical baseline: 60% · GENIUS Act: ~80%
        </p>
      </div>
    </div>
  );
}

// ─── Market Condition Selector ─────────────────────────────────────────────────

const CONDITIONS = [
  { id: "normal",   label: "Normal",   sub: "α = 0.714", desc: "RRP draining, ample supply",      activeClass: "bg-emerald-600 text-white", subClass: "text-emerald-200" },
  { id: "scarcity", label: "Scarcity", sub: "α = 1.429", desc: "RRP growing, tight supply",       activeClass: "bg-yellow-500 text-white",  subClass: "text-yellow-100"  },
  { id: "crisis",   label: "Crisis",   sub: "α = 2.143", desc: "Debt ceiling, frozen issuance",   activeClass: "bg-red-600 text-white",     subClass: "text-red-200"     },
];

// ─── Short-Run Tab ─────────────────────────────────────────────────────────────

function ShortRunTab({
  scenarios,
  reserves,
  liveMarketCapBillions,
}: {
  scenarios: Scenario[];
  reserves: ReserveComposition;
  liveMarketCapBillions: number | null;
}) {
  const [condition, setCondition] = useState("normal");
  const [tExecution, setTExecution] = useState(5);

  const modelScenarios = scenarios.filter((s) => ["bear", "base", "bull"].includes(s.id));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market condition */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Market Condition</p>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCondition(c.id)}
                className={`flex-1 py-2 px-2 rounded-lg text-center transition-colors ${
                  condition === c.id
                    ? c.activeClass
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="block text-sm font-medium">{c.label}</span>
                <span className={`block text-xs mt-0.5 ${condition === c.id ? c.subClass : "text-gray-400"}`}>
                  {c.sub}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {CONDITIONS.find((c) => c.id === condition)?.desc}
          </p>
        </div>

        {/* T-execution */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-gray-700">Urgency Factor <span className="font-normal text-gray-400">(days to execute)</span></p>
            <span className="text-sm font-mono font-semibold text-gray-900">
              {tExecution} day{tExecution !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-1">Higher urgency amplifies the yield impact — faster execution means more market pressure.</p>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={tExecution}
            onChange={(e) => setTExecution(Number(e.target.value))}
            className="w-full cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1 day (panic)</span>
            <span>20 days (orderly)</span>
          </div>
        </div>
      </div>

      {liveMarketCapBillions === null ? (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Awaiting live DeFi Llama market cap data…
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Live market cap: <span className="font-mono font-semibold text-gray-700">${liveMarketCapBillions.toFixed(1)}B</span>
            &nbsp;·&nbsp; Flow = 300.8B − Scenario MC
            &nbsp;·&nbsp; Reserve share: <span className="font-mono font-semibold text-gray-700">{reserves.treasuryPct}%</span>
          </p>

          <div className="flex gap-4 flex-wrap md:flex-nowrap">
            {modelScenarios.map((scenario) => {
              const flow = liveMarketCapBillions - scenario.marketCapBillions;
              const result = computeShortRun({ flow, scenario: condition, tExecution, reservePct: reserves.treasuryPct });
              return (
                <ResultColumn
                  key={scenario.id}
                  scenarioLabel={scenario.label}
                  deltaY={result.deltaY}
                  rows={[
                    { label: "300.8B − Scenario MC", value: `${flow >= 0 ? "+" : ""}${flow.toFixed(1)}B` },
                    { label: "α (yield sensitivity to demand)", value: SHORT_RUN_ALPHA[condition].toFixed(3) },
                  ]}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            ΔY = α × Flow × (T_ref / T_execution) × (r / 0.60) · Source: Ahmed &amp; Aldasoro (2025), BIS WP 1270
          </p>
        </>
      )}
    </div>
  );
}

// ─── Long-Run Tab ──────────────────────────────────────────────────────────────

function LongRunTab({
  scenarios,
  reserves,
  liveMarketCapBillions,
}: {
  scenarios: Scenario[];
  reserves: ReserveComposition;
  liveMarketCapBillions: number | null;
}) {
  const modelScenarios = scenarios.filter((s) => ["bear", "base", "bull"].includes(s.id));

  if (liveMarketCapBillions === null) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        Awaiting live DeFi Llama market cap data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400">
        Current Market Cap: <span className="font-mono font-semibold text-gray-700">${liveMarketCapBillions.toFixed(1)}B</span>
        &nbsp;·&nbsp; β = −2.9858 (yield sensitivity to stablecoin demand, 13-week T-bill) · λ = 50
        &nbsp;·&nbsp; Reserve share: <span className="font-mono font-semibold text-gray-700">{reserves.treasuryPct}%</span>
      </p>

      <div className="flex gap-4 flex-wrap md:flex-nowrap">
        {modelScenarios.map((scenario) => {
          const result = computeLongRun({ sNew: scenario.marketCapBillions, sOld: liveMarketCapBillions, reservePct: reserves.treasuryPct });
          return (
            <ResultColumn
              key={scenario.id}
              scenarioLabel={scenario.label}
              deltaY={result.deltaY}
              rows={[
                { label: "Scenario Market Cap", value: `$${scenario.marketCapBillions}B` },
                { label: "Current Market Cap", value: `$${liveMarketCapBillions.toFixed(1)}B` },
              ]}
            />
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        ΔY = 100 × β × ln(S_new / S_old) × (1/50) × (r / 0.72) · Source: Ahmed &amp; Aldasoro (2025), BIS WP 1270
      </p>
    </div>
  );
}

// ─── Main Card ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "short", label: "Short-Term", sub: "Flow Impact (10–20 days)" },
  { id: "long",  label: "Long-Term",  sub: "Structural Compression"   },
];

export default function ScenarioModellingCard({
  liveMarketCapBillions,
}: {
  liveMarketCapBillions: number | null;
}) {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState("base");
  const [reserves, setReserves] = useState<ReserveComposition>(DEFAULT_RESERVES);
  const [activeTab, setActiveTab] = useState<"short" | "long">("short");

  function handleReserveChange(v: number) {
    setReserves({ treasuryPct: Math.min(100, Math.max(0, v)) });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Scenario Modelling</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Estimated yield impact on US T-bills under Bear / Base / Bull stablecoin scenarios
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
        <ScenariosPanel
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onScenariosChange={setScenarios}
          onActiveChange={() => {}}
        />
        <ReservePanel reserves={reserves} onChange={handleReserveChange} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "short" | "long")}
              className={`px-6 py-3 text-left transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="block text-xs mt-0.5 text-gray-400">{tab.sub}</span>
            </button>
          ))}
        </div>

        {activeTab === "short"
          ? <ShortRunTab scenarios={scenarios} reserves={reserves} liveMarketCapBillions={liveMarketCapBillions} />
          : <LongRunTab  scenarios={scenarios} reserves={reserves} liveMarketCapBillions={liveMarketCapBillions} />
        }
      </div>
    </div>
  );
}
