import type { ReserveComposition, Scenario, ScenarioMetrics } from "@/types/dashboard";

const TOTAL_TREASURIES_OUTSTANDING_BILLIONS = 27_000;

export const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "bear", label: "Bear", marketCapBillions: 100 },
  { id: "base", label: "Base", marketCapBillions: 300 },
  { id: "bull", label: "Bull", marketCapBillions: 500 },
];

export const DEFAULT_RESERVES: ReserveComposition = {
  treasuryPct: 80,
};

export function computeMetrics(scenario: Scenario, reserves: ReserveComposition): ScenarioMetrics {
  const { marketCapBillions } = scenario;
  const treasuryDemandBillions = marketCapBillions * (reserves.treasuryPct / 100);
  const treasuryDemandAsShareOfMarket =
    (treasuryDemandBillions / TOTAL_TREASURIES_OUTSTANDING_BILLIONS) * 100;

  return {
    scenarioLabel: scenario.label,
    marketCapBillions,
    treasuryDemandBillions,
    treasuryDemandAsShareOfMarket,
  };
}

export function formatBillions(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
  return `$${value.toFixed(1)}B`;
}
