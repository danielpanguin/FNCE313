import type { ReserveComposition, Scenario, ScenarioMetrics, OverviewConfig } from "@/types/dashboard";

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

// ─── Overview / Long-Run Structural Model ─────────────────────────────────────
// Source: Ahmed & Aldasoro (2025), BIS WP 1270

const BETA_13W = -2.9858;
const R_BASELINE_OVERVIEW = 0.72;
const TBILL_OUT_BILLIONS = 6000; // ~$6T outstanding T-bills

export interface OverviewResult {
  effectiveShare: number;   // decimal (direct + indirect * lookThrough)
  effectiveDemand: number;  // $B
  deltaY: number;           // bps
  annualSavings: number;    // $B/yr
}

export const DEFAULT_OVERVIEW: OverviewConfig = {
  projectedMC: 1200,
  directPct: 55,
  indirectPct: 25,
  lookThrough: 80,
  lambda: 50,
  horizonYears: 3,
};

export const BASELINE_MC = 300.8; // $B — current stablecoin market cap

export function computeOverview(cfg: OverviewConfig): OverviewResult {
  const es = cfg.directPct / 100 + (cfg.indirectPct / 100) * (cfg.lookThrough / 100);
  const ed = cfg.projectedMC * es;
  const deltaY =
    BETA_13W *
    Math.log(cfg.projectedMC / BASELINE_MC) *
    100 *
    (1 / cfg.lambda) *
    (es / R_BASELINE_OVERVIEW);
  const annualSavings = (Math.abs(deltaY) / 100) * (TBILL_OUT_BILLIONS / 100);
  return { effectiveShare: es, effectiveDemand: ed, deltaY, annualSavings };
}

export function computeGrowthTrajectory(
  cfg: OverviewConfig
): { label: string; mc: number; demand: number }[] {
  const cagr = Math.pow(cfg.projectedMC / BASELINE_MC, 1 / cfg.horizonYears) - 1;
  const es = cfg.directPct / 100 + (cfg.indirectPct / 100) * (cfg.lookThrough / 100);
  const points = [{ label: "Now", mc: BASELINE_MC, demand: BASELINE_MC * es }];
  for (let y = 1; y <= cfg.horizonYears; y++) {
    const mc = BASELINE_MC * Math.pow(1 + cagr, y);
    points.push({ label: `+${y}yr`, mc, demand: mc * es });
  }
  return points;
}
