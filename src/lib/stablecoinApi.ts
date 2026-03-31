export interface StablecoinDataPoint {
  date: number; // unix timestamp
  totalUSD: number;
}

export async function fetchFiatBackedUSDHistory(): Promise<StablecoinDataPoint[]> {
  const res = await fetch("/api/stablecoins");
  if (!res.ok) throw new Error(`Stablecoin API error: ${res.status}`);
  return res.json();
}

export function getLatestTotalBillions(data: StablecoinDataPoint[]): number {
  if (data.length === 0) return 0;
  return data[data.length - 1].totalUSD / 1e9;
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
