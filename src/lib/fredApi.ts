// Client-side helpers for FRED API (via server-side proxy at /api/fred)

export const FRED_SERIES = {
  TBILL_RATE:  "DTB3",      // 3-Month T-bill secondary market rate (%)       — daily
  TBILL_OUT:   "WMTSNS",    // Treasury bills outstanding ($M)                — weekly
  MMF_ASSETS:  "WRMFNS",    // Retail money market fund assets ($B)           — monthly
  RRP_BALANCE: "RRPONTSYD", // Overnight reverse repo (RRP) balance ($B)      — daily
} as const;

export interface FredObservation {
  value: number;
  date:  string;
}

/** Fetch the latest non-null value for a single FRED series. */
export async function fetchFredLatest(series: string): Promise<FredObservation> {
  const res = await fetch(`/api/fred?series=${series}`);
  if (!res.ok) throw new Error(`FRED fetch failed for ${series}: ${res.status}`);
  const data = await res.json() as { value: number; date: string };
  return { value: data.value, date: data.date };
}

/** Fetch multiple recent observations (useful for computing year-over-year changes). */
export async function fetchFredHistory(
  series: string,
  limit: number
): Promise<FredObservation[]> {
  const res = await fetch(`/api/fred?series=${series}&limit=${limit}`);
  if (!res.ok) throw new Error(`FRED history fetch failed for ${series}: ${res.status}`);
  const data = await res.json() as { observations: FredObservation[] };
  return data.observations;
}
