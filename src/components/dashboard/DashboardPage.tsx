"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Scenario } from "@/types/dashboard";
import { DEFAULT_SCENARIOS, DEFAULT_RESERVES } from "@/lib/calculations";
import StablecoinInputPanel from "./StablecoinInputPanel";
import ReserveCompositionPanel from "./ReserveCompositionPanel";

const TreasuryYieldChart = dynamic(() => import("./TreasuryYieldChart"), { ssr: false });
const StablecoinMarketCapChart = dynamic(() => import("./StablecoinMarketCapChart"), { ssr: false });

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("base");
  const [reserves, setReserves] = useState(DEFAULT_RESERVES);

  function handleReserveChange(value: number) {
    setReserves({ treasuryPct: Math.min(100, Math.max(0, value)) });
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
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StablecoinMarketCapChart />
          <TreasuryYieldChart />
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StablecoinInputPanel
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onScenariosChange={setScenarios}
            onActiveChange={setActiveScenarioId}
          />
          <ReserveCompositionPanel reserves={reserves} onChange={handleReserveChange} />
        </div>
      </main>
    </div>
  );
}
