"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ScenarioModellingCard from "./ScenarioModellingCard";

const TreasuryYieldChart = dynamic(() => import("./TreasuryYieldChart"), { ssr: false });
const StablecoinMarketCapChart = dynamic(() => import("./StablecoinMarketCapChart"), { ssr: false });

export default function DashboardPage() {
  const [liveMarketCapBillions] = useState<number | null>(300.8);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">US Treasury Demand Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Model stablecoin-driven Treasury demand across reserve composition scenarios
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StablecoinMarketCapChart />
          <TreasuryYieldChart />
        </div>

        <ScenarioModellingCard liveMarketCapBillions={liveMarketCapBillions} />
      </main>
    </div>
  );
}
