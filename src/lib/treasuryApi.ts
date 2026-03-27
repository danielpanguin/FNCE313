const BASE_URL =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates";

export interface TreasuryRateRecord {
  record_date: string;
  security_desc: string;
  avg_interest_rate_amt: string;
}

export interface TreasuryApiResponse {
  data: TreasuryRateRecord[];
  meta: { "total-count": number };
}

// Securities we care about
export const TRACKED_SECURITIES = ["Treasury Bills"];

export const SECURITY_COLORS: Record<string, string> = {
  "Treasury Bills": "#3B82F6",
};

export const SECURITY_SHORT: Record<string, string> = {
  "Treasury Bills": "T-Bills",
};

export interface YieldDataPoint {
  date: string;
  [security: string]: string | number;
}

export async function fetchTreasuryYields(fromDate: string): Promise<YieldDataPoint[]> {
  const filter = [
    `record_date:gte:${fromDate}`,
    `security_desc:in:(${TRACKED_SECURITIES.join(",")})`,
  ].join(",");

  const params = new URLSearchParams({
    fields: "record_date,security_desc,avg_interest_rate_amt",
    filter,
    sort: "record_date",
    limit: "500",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Treasury API error: ${res.status}`);

  const json: TreasuryApiResponse = await res.json();

  // Pivot rows into { date, "Treasury Bills": 3.72, ... }
  const map = new Map<string, YieldDataPoint>();
  for (const row of json.data) {
    if (!TRACKED_SECURITIES.includes(row.security_desc)) continue;
    if (!map.has(row.record_date)) {
      map.set(row.record_date, { date: row.record_date });
    }
    map.get(row.record_date)![row.security_desc] = parseFloat(row.avg_interest_rate_amt);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
