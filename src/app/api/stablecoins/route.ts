import { NextResponse } from "next/server";

export const maxDuration = 60; // extend Vercel timeout to 60s

export async function GET() {
  try {
    // Step 1 — get fiat-backed USD stablecoin IDs (single small request)
    const listRes = await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true");
    if (!listRes.ok) throw new Error(`List fetch failed: ${listRes.status}`);
    const { peggedAssets } = await listRes.json();

    const filteredIds: string[] = peggedAssets
      .filter(
        (s: { pegType: string; pegMechanism: string }) =>
          s.pegType === "peggedUSD" && s.pegMechanism === "fiat-backed"
      )
      .map((s: { id: string }) => s.id);

    // Step 2 — fetch lightweight chart data per coin (not full token detail)
    const charts = await Promise.all(
      filteredIds.map((id) =>
        fetch(`https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=${id}`, {
          next: { revalidate: 3600 },
        }).then((r) => r.json())
      )
    );

    // Step 3 — sum peggedUSD by date across all coins
    const dailyTotals: Record<number, number> = {};
    for (const chart of charts) {
      for (const entry of chart ?? []) {
        const date: number = entry.date;
        const supply: number = entry.totalCirculating?.peggedUSD ?? 0;
        dailyTotals[date] = (dailyTotals[date] ?? 0) + supply;
      }
    }

    const data = Object.entries(dailyTotals)
      .map(([date, totalUSD]) => ({ date: Number(date), totalUSD }))
      .filter((d) => d.totalUSD > 0)
      .sort((a, b) => a.date - b.date)
      .slice(0, -3); // drop last 3 days — incomplete data as coins report at different times

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
