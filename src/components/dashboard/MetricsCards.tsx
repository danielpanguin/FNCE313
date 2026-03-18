"use client";

import type { ScenarioMetrics } from "@/types/dashboard";
import MetricCard from "@/components/ui/MetricCard";
import { formatBillions } from "@/lib/calculations";

interface Props {
  metrics: ScenarioMetrics;
}

export default function MetricsCards({ metrics }: Props) {
  const cashEquivalent = metrics.treasuryDemandBillions + metrics.cashHoldingsBillions;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="US Treasury Demand"
        value={formatBillions(metrics.treasuryDemandBillions)}
        sub={`Active: ${metrics.scenarioLabel}`}
        accent="bg-blue-50"
      />
      <MetricCard
        label="% of $27T Treasury Market"
        value={`${metrics.treasuryDemandAsShareOfMarket.toFixed(3)}%`}
        sub="Share of outstanding"
        accent="bg-indigo-50"
      />
      <MetricCard
        label="Stablecoin Market Cap"
        value={formatBillions(metrics.marketCapBillions)}
        sub="Total supply"
        accent="bg-emerald-50"
      />
      <MetricCard
        label="Cash-Equivalent Holdings"
        value={formatBillions(cashEquivalent)}
        sub="Treasuries + Cash"
        accent="bg-amber-50"
      />
    </div>
  );
}
