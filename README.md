# FNCE313 — US Treasury Demand Dashboard

An interactive analytics dashboard modelling the demand for US Treasury securities driven by USD-pegged, fiat-backed stablecoin growth. Built with Next.js, TypeScript, and Tailwind CSS.

---

## What It Does

The dashboard has three sections:

1. **Live Data Charts** — real-time market data fetched from public APIs
2. **Demand Inputs** — manual scenario inputs for stablecoin market cap and reserve composition
3. **Scenario Modelling** — quantitative models estimating the yield impact on T-bills

---

## Section 1 — Live Data Charts

Two charts sit side-by-side at the top of the page.

### Stablecoin Market Cap (Historical)
**Source:** [DeFi Llama Stablecoins API](https://stablecoins.llama.fi)

Displays the day-by-day total market capitalisation of all fiat-backed, USD-pegged stablecoins. The data pipeline:

1. Fetches all stablecoins from `/stablecoins?includePrices=true`
2. Filters to `pegType === "peggedUSD"` and `pegMechanism === "fiat-backed"`
3. Fetches historical supply for each coin individually
4. Sums `circulating.peggedUSD` by date to produce a daily aggregate

Includes range filters: **1Y / 2Y / 3Y / All**. X-axis ticks are formatted as monthly intervals.

**Relevant file:** [`src/lib/stablecoinApi.ts`](src/lib/stablecoinApi.ts)

---

### US Treasury Average Interest Rate (T-Bills)
**Source:** [US Treasury Fiscal Data API](https://fiscaldata.treasury.gov)

Endpoint:
```
GET https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates
```

Filtered to `security_desc = "Treasury Bills"` only. Displays the monthly average interest rate as a line chart.

Includes range filters: **1Y / 2Y / 3Y / 5Y**.

**Relevant file:** [`src/lib/treasuryApi.ts`](src/lib/treasuryApi.ts)

---

## Section 2 — Demand Inputs

### Stablecoin Demand Scenarios
A table of named scenarios (Bear / Base / Bull / Ultra Bull), each with a manually entered market cap in $B. Scenarios can be added or removed. One scenario is marked active at a time.

### Reserve Composition
A single slider for **Direct & Indirect Treasury Holdings** — the combined percentage of stablecoin reserves held in US Treasuries (directly as T-bills/notes/bonds, or indirectly via money market funds and repo agreements).

- Default: **80%**
- GENIUS Act compliant issuers: ~80%
- Historical baseline (2021–2025): ~60%

---

## Section 3 — Scenario Modelling

A tabbed card implementing two quantitative models from:

> Ahmed, R., & Aldasoro, I. (2025, May 28). *Stablecoins and safe asset prices*. BIS Working Paper 1270. https://www.bis.org/publ/work1270.htm

---

### Model 1 — Short-Run Flow Impact

**Tab:** Short-Term

**Equation:**
```
ΔY = α_scenario × Flow × (T_ref / T_execution) × (r / r_embedded)
```

**Output:** Change in 3-month T-bill yield in **basis points** over a 10–20 day window.

| Parameter | Description | Values |
|---|---|---|
| `α_scenario` | Market condition coefficient | Normal: 0.714 · Scarcity: 1.429 · Crisis: 2.143 |
| `Flow` | 5-day change in stablecoin market cap ($B) | User input · negative = inflow |
| `T_ref` | Reference execution window (fixed) | 5 days |
| `T_execution` | Actual execution speed | 1–5 days (user input) |
| `r` | Assumed T-bill reserve share | User slider (%) |
| `r_embedded` | Historical baseline reserve share | 0.60 (60%) |

The `T_ref / T_execution` ratio is capped at 5.0 (panic / full bank-run scenario).

**Worked examples:**

| Scenario | Flow | α | T ratio | r ratio | ΔY |
|---|---|---|---|---|---|
| Normal inflow, pre-GENIUS | −$3.5B | 0.714 | 1.0 | 1.00 | −2.50 bps |
| Normal inflow, GENIUS Act | −$3.5B | 0.714 | 1.0 | 1.33 | −3.33 bps |
| Panic outflow, crisis, GENIUS | +$3.5B | 2.143 | 5.0 | 1.33 | +49.9 bps |

**Relevant file:** [`src/lib/scenarioModels.ts`](src/lib/scenarioModels.ts)

---

### Model 2 — Long-Run Structural Compression

**Tab:** Long-Term

**Equation:**
```
ΔY = 100 × β_avg × ln(S_new / S_old) × (1/λ) × (r / r_baseline)
```

**Output:** Permanent structural shift in **13-week T-bill yield** in basis points. Effect is zero for maturities beyond 13 weeks.

| Parameter | Description | Value |
|---|---|---|
| `β_avg` | 13-week T-bill regression coefficient | −2.9858 |
| `S_new` | Projected stablecoin market cap ($B) | User input |
| `S_old` | Baseline market cap ($B) | Default $272B (USDT+USDC late 2025) |
| `λ` | General equilibrium attenuation factor | 50 (fixed) |
| `r` | Assumed T-bill reserve share | User slider (%) |
| `r_baseline` | Historical weighted-average reserve share | 0.72 (72%) |

`r_baseline` is computed as: `(0.65 × 0.70) + (0.87 × 0.30) = 0.716 ≈ 0.72`
(Tether 65% reserve share, 70% market weight; USDC 87% reserve share, 30% market weight)

The natural log term builds in **diminishing returns** automatically — doubling supply from $272B to $544B has a larger effect than doubling from $1T to $2T.

**Relevant file:** [`src/lib/scenarioModels.ts`](src/lib/scenarioModels.ts)

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `next` | 16 | App Router, SSR/SSG |
| `react` / `react-dom` | 19 | UI |
| `typescript` | 5 | Type safety |
| `tailwindcss` | 4 | Styling |
| `recharts` | 3 | Charts |

---

## Project Structure

```
src/
  app/
    page.tsx                  Entry point
    layout.tsx                Root layout
    globals.css               Tailwind imports
  components/
    dashboard/
      DashboardPage.tsx       Root client component, owns all state
      StablecoinInputPanel.tsx  Scenario table with market cap inputs
      ReserveCompositionPanel.tsx  Treasury reserve % slider
      StablecoinMarketCapChart.tsx  Historical stablecoin market cap chart
      TreasuryYieldChart.tsx  T-bill average interest rate chart
      ScenarioModellingCard.tsx  Short-run & long-run yield impact models
    ui/
      Card.tsx                Reusable card wrapper
      MetricCard.tsx          KPI card with hover tooltip
  lib/
    stablecoinApi.ts          DeFi Llama data fetching + aggregation
    treasuryApi.ts            US Treasury Fiscal Data API fetching
    calculations.ts           Demand scenario formulas
    scenarioModels.ts         BIS short-run and long-run model equations
  types/
    dashboard.ts              Shared TypeScript interfaces
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data Sources & References

- **DeFi Llama Stablecoins API** — https://stablecoins.llama.fi
- **US Treasury Fiscal Data API** — https://fiscaldata.treasury.gov
- **Ahmed, R., & Aldasoro, I. (2025).** *Stablecoins and safe asset prices.* BIS Working Paper No. 1270. https://www.bis.org/publ/work1270.htm
- **GENIUS Act** (Guiding and Establishing National Innovation for US Stablecoins) — proposed reserve requirements for compliant stablecoin issuers
