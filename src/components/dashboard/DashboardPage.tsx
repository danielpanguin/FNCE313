"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Scenario, ReserveComposition } from "@/types/dashboard";
import {
  DEFAULT_SCENARIOS,
  DEFAULT_RESERVES,
  computeMetrics,
  redistributeReserves,
} from "@/lib/calculations";
import StablecoinInputPanel from "./StablecoinInputPanel";
import ReserveCompositionPanel from "./ReserveCompositionPanel";
import MetricsCards from "./MetricsCards";

const TreasuryYieldChart = dynamic(() => import("./TreasuryYieldChart"), { ssr: false });
const ReserveCompositionChart = dynamic(() => import("./ReserveCompositionChart"), { ssr: false });

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("base");
  const [reserves, setReserves] = useState<ReserveComposition>(DEFAULT_RESERVES);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0],
    [scenarios, activeScenarioId]
  );

  const activeMetrics = useMemo(
    () => computeMetrics(activeScenario, reserves),
    [activeScenario, reserves]
  );

  function handleReserveChange(field: keyof ReserveComposition, value: number) {
    setReserves((prev) => redistributeReserves(prev, field, value));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">US Treasury Demand Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Model stablecoin-driven Treasury demand across reserve composition scenarios
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StablecoinInputPanel
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onScenariosChange={setScenarios}
            onActiveChange={setActiveScenarioId}
          />
          <div className="space-y-6">
            <ReserveCompositionPanel reserves={reserves} onChange={handleReserveChange} />
            <ReserveCompositionChart reserves={reserves} />
          </div>
        </div>

        {/* KPI Cards */}
        <MetricsCards metrics={activeMetrics} />

        {/* Chart */}
        <TreasuryYieldChart />
      </main>
    </div>
  );
}
