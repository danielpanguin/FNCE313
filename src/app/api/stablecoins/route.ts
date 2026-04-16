import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  try {
    // Single request — global chart for ALL stablecoins
    const res = await fetch("https://stablecoins.llama.fi/stablecoincharts/all", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`DeFi Llama responded ${res.status}`);

    const raw: { date: number; totalCirculatingUSD?: { peggedUSD?: number } }[] = await res.json();

    const data = raw
      .map((entry) => ({
        date: entry.date,
        totalUSD: entry.totalCirculatingUSD?.peggedUSD ?? 0,
      }))
      .filter((d) => d.totalUSD > 0)
      .slice(0, -3); // drop last 3 days — incomplete as coins report at different times

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
