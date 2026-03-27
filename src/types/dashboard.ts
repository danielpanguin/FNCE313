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
