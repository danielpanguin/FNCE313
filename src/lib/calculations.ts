import type { ReserveComposition, Scenario, ScenarioMetrics } from "@/types/dashboard";

const TOTAL_TREASURIES_OUTSTANDING_BILLIONS = 27_000;

export const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "bear", label: "Bear", marketCapBillions: 100 },
  { id: "base", label: "Base", marketCapBillions: 300 },
  { id: "bull", label: "Bull", marketCapBillions: 500 },
  { id: "ultra", label: "Ultra Bull", marketCapBillions: 1000 },
];

export const DEFAULT_RESERVES: ReserveComposition = {
  treasuries: 80,
  cash: 10,
  corporateBonds: 5,
  other: 5,
};

export function computeMetrics(scenario: Scenario, reserves: ReserveComposition): ScenarioMetrics {
  const { marketCapBillions } = scenario;
  const treasuryDemandBillions = marketCapBillions * (reserves.treasuries / 100);
  const cashHoldingsBillions = marketCapBillions * (reserves.cash / 100);
  const corpBondsBillions = marketCapBillions * (reserves.corporateBonds / 100);
  const otherBillions = marketCapBillions * (reserves.other / 100);
  const treasuryDemandAsShareOfMarket =
    (treasuryDemandBillions / TOTAL_TREASURIES_OUTSTANDING_BILLIONS) * 100;

  return {
    scenarioLabel: scenario.label,
    marketCapBillions,
    treasuryDemandBillions,
    cashHoldingsBillions,
    corpBondsBillions,
    otherBillions,
    treasuryDemandAsShareOfMarket,
  };
}

export function redistributeReserves(
  prev: ReserveComposition,
  changedField: keyof ReserveComposition,
  newValue: number
): ReserveComposition {
  const clamped = Math.min(100, Math.max(0, newValue));
  const delta = clamped - prev[changedField];
  const otherFields = (Object.keys(prev) as Array<keyof ReserveComposition>).filter(
    (k) => k !== changedField
  );
  const otherSum = otherFields.reduce((acc, k) => acc + prev[k], 0);
  const updated = { ...prev, [changedField]: clamped };

  if (otherSum === 0 || delta === 0) return updated;

  otherFields.forEach((k) => {
    updated[k] = Math.max(0, prev[k] - delta * (prev[k] / otherSum));
  });

  // Fix floating point drift
  const total = Object.values(updated).reduce((a, b) => a + b, 0);
  updated[otherFields[otherFields.length - 1]] += 100 - total;

  return updated;
}

export function formatBillions(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}T`;
  return `$${value.toFixed(1)}B`;
}
