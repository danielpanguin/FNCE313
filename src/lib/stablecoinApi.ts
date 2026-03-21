export interface StablecoinDataPoint {
  date: number; // unix timestamp
  totalUSD: number;
}

export async function fetchFiatBackedUSDHistory(): Promise<StablecoinDataPoint[]> {
  // Step 1 - get fiat-backed USD stablecoin IDs
  const { peggedAssets } = await fetch(
    "https://stablecoins.llama.fi/stablecoins?includePrices=true"
  ).then((r) => r.json());

  const filteredIds: string[] = peggedAssets
    .filter(
      (s: { pegType: string; pegMechanism: string }) =>
        s.pegType === "peggedUSD" && s.pegMechanism === "fiat-backed"
    )
    .map((s: { id: string }) => s.id);

  // Step 2 - fetch historical supply for each
  const histories = await Promise.all(
    filteredIds.map((id) =>
      fetch(`https://stablecoins.llama.fi/stablecoin/${id}`).then((r) => r.json())
    )
  );

  // Step 3 - sum by date
  const dailyTotals: Record<number, number> = {};
  for (const coin of histories) {
    for (const entry of coin.tokens ?? []) {
      const date: number = entry.date;
      const supply: number = entry.circulating?.peggedUSD ?? 0;
      dailyTotals[date] = (dailyTotals[date] ?? 0) + supply;
    }
  }

  return Object.entries(dailyTotals)
    .map(([date, totalUSD]) => ({ date: Number(date), totalUSD }))
    .sort((a, b) => a.date - b.date);
}

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

export function fmtDateFromUnix(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
