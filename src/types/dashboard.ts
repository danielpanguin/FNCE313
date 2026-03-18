export interface ReserveComposition {
  treasuries: number;
  cash: number;
  corporateBonds: number;
  other: number;
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
  cashHoldingsBillions: number;
  corpBondsBillions: number;
  otherBillions: number;
  treasuryDemandAsShareOfMarket: number;
}
