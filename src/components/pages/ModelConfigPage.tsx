"use client";

import Card from "@/components/ui/Card";

const LONG_RUN_PARAMS = [
  ["β (13-week sensitivity)", "−2.9858",          "Table 10, avg IV coeff 13w"],
  ["S₀ (baseline MC)",        "$300.8B",           "DeFiLlama (Apr 11, 2026)"],
  ["r_baseline",              "0.72 (72%)",        "(0.65 × 0.70) + (0.87 × 0.30)"],
  ["λ (attenuation)",         "50 (default)",      "Footnote 28, GE dampening"],
  ["× 100",                   "Unit conversion",   "pct points → bps"],
  ["Effect horizon",          "4-, 8-, 13-week",   "Zero effect beyond 13 weeks"],
];

const SHORT_RUN_PARAMS = [
  ["α (Normal)",    "0.714 bps/$1B",  "RRP draining, ample supply"],
  ["α (Scarcity)",  "1.429 bps/$1B",  "RRP growing, tight supply"],
  ["α (Crisis)",    "2.143 bps/$1B",  "Debt ceiling, frozen issuance"],
  ["T_ref",         "5 days (fixed)", "Reference execution window"],
  ["T_execution",   "1–20 days",      "User-controlled urgency factor"],
  ["r_embedded",    "0.60 (60%)",     "2021–2025 weighted avg"],
  ["Effect horizon","10–20 days",     "Short-lived; fades post-execution"],
];

const MATURITY = [
  ["4-week",  "−1.7842"],
  ["8-week",  "−2.1937"],
  ["13-week", "−2.9858"],
  ["Average", "−2.3212"],
];

function ParamTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-gray-200">
            {["Parameter", "Value", "Source / Note"].map((h) => (
              <th key={h} className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([param, val, src], i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2.5 px-3 text-gray-700 font-medium">{param}</td>
              <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{val}</td>
              <td className="py-2.5 px-3 text-gray-500">{src}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModelConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Model Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Reference parameters and sources for both quantitative models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Long-Run Structural Compression">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-blue-600 mb-4">
            <p className="text-[10px] text-gray-400 font-sans mb-1">Ahmed &amp; Aldasoro — BIS WP 1270 (2025)</p>
            ΔY = 100 × β × ln(S_new / S₀) × (1/λ) × (r / 0.72)
          </div>
          <ParamTable rows={LONG_RUN_PARAMS} />
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
            Captures a <strong>permanent</strong> yield shift. The log specification gives diminishing returns —
            each doubling adds the same bps. Effect persists as long as the market stays at its new size.
          </div>
        </Card>

        <Card title="Short-Run Flow Impact">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-blue-600 mb-4">
            <p className="text-[10px] text-gray-400 font-sans mb-1">Ahmed &amp; Aldasoro — BIS WP 1270 (2025)</p>
            ΔY = α × Flow × (T_ref / T_execution) × (r / 0.60)
          </div>
          <ParamTable rows={SHORT_RUN_PARAMS} />
          <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
            <strong>Short-lived effect</strong> — fades after execution. Positive ΔY = yields rise (sell pressure).
            SVB precedent: $3.3B shock → ~20 bps spike at α = Normal.
          </div>
        </Card>
      </div>

      <Card title="β Coefficients by Maturity">
        <p className="text-xs text-gray-400 mb-4">
          USDT + USDC combined. Zero effect confirmed for all maturities beyond 13 weeks (Table 7).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {["Maturity", "β (USDT + USDC)"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATURITY.map(([mat, beta], i) => (
                <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${mat === "Average" ? "font-semibold bg-blue-50" : ""}`}>
                  <td className="py-2.5 px-3 text-gray-700">{mat}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700">{beta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-600 mb-2">Sources</p>
        <ul className="text-xs text-gray-500 space-y-1.5 leading-relaxed">
          <li>Ahmed, R., &amp; Aldasoro, I. (2025, May 28). <em>Stablecoins and safe asset prices.</em> BIS Working Paper No. 1270.</li>
          <li>De la Horra, L. P., Perote, J., &amp; Vega, J. (2025). <em>Stablecoins as structural T-bill buyers.</em></li>
          <li>GENIUS Act (2025) — reserve composition requirements for compliant stablecoin issuers.</li>
          <li>U.S. Treasury TBAC Q1 2026 — net new T-bill issuance projections (~$433B/yr).</li>
        </ul>
      </div>
    </div>
  );
}
