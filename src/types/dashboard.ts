export interface ReserveComposition {
  treasuryPct: number;
}

export interface Scenario {
  id: string;
  label: string;
  marketCapBillions: number;
}

export interface ScenarioMetrics {
  scenarioLabel: string;
  marketCapBillions: number;
  treasuryDemandBillions: number;
  treasuryDemandAsShareOfMarket: number;
}

export interface OverviewConfig {
  projectedMC: number;    // $B
  directPct: number;      // 0–100
  indirectPct: number;    // 0–100
  lookThrough: number;    // 0–100
  lambda: number;         // 15–120
  horizonYears: number;   // 1–10
}
