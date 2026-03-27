// ─── Model 1: Short-Run Flow Impact ───────────────────────────────────────────
// ΔY = α_scenario × Flow × (T_ref / T_execution) × (r / r_embedded)
// Source: Ahmed & Aldasoro (2025) — BIS Working Paper 1270

export const SHORT_RUN_ALPHA: Record<string, number> = {
  normal: 0.714,
  scarcity: 1.429,
  crisis: 2.143,
};

const T_REF = 5;
const R_EMBEDDED = 0.60;

export interface ShortRunInputs {
  flow: number;          // $B, negative = inflow, positive = outflow
  scenario: string;      // "normal" | "scarcity" | "crisis"
  tExecution: number;    // days, 1–5
  reservePct: number;    // % (0–100)
}

export interface ShortRunResult {
  deltaY: number;        // bps
  alpha: number;
  tRatio: number;
  rRatio: number;
}

export function computeShortRun(inputs: ShortRunInputs): ShortRunResult {
  const alpha = SHORT_RUN_ALPHA[inputs.scenario];
  const tRatio = Math.min(T_REF / inputs.tExecution, 5.0);
  const rRatio = (inputs.reservePct / 100) / R_EMBEDDED;
  const deltaY = alpha * inputs.flow * tRatio * rRatio;
  return { deltaY, alpha, tRatio, rRatio };
}

// ─── Model 2: Long-Run Structural Compression ─────────────────────────────────
// ΔY = 100 × β_avg × ln(S_new / S_old) × (1/λ) × (r / r_baseline)
// Source: Ahmed & Aldasoro (2025) — BIS Working Paper 1270

const BETA_13W = -2.9858;
const LAMBDA = 50;
const R_BASELINE = 0.79;

export const S_OLD_DEFAULT = 272; // $272B — combined USDT+USDC baseline (late 2025)

export interface LongRunInputs {
  sNew: number;          // $B projected market cap
  sOld: number;          // $B baseline (default 272)
  reservePct: number;    // % (0–100)
}

export interface LongRunResult {
  deltaY: number;        // bps
  logRatio: number;
  rRatio: number;
}

export function computeLongRun(inputs: LongRunInputs): LongRunResult {
  if (inputs.sNew <= 0 || inputs.sOld <= 0) return { deltaY: 0, logRatio: 0, rRatio: 0 };
  const logRatio = Math.log(inputs.sNew / inputs.sOld);
  const rRatio = (inputs.reservePct / 100) / R_BASELINE;
  const deltaY = 100 * BETA_13W * logRatio * (1 / LAMBDA) * rRatio;
  return { deltaY, logRatio, rRatio };
}
