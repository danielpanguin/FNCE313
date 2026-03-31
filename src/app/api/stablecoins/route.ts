import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 1 — get fiat-backed USD stablecoin IDs
    const listRes = await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true");
    const { peggedAssets } = await listRes.json();

    const filteredIds: string[] = peggedAssets
      .filter(
        (s: { pegType: string; pegMechanism: string }) =>
          s.pegType === "peggedUSD" && s.pegMechanism === "fiat-backed"
      )
      .map((s: { id: string }) => s.id);

    // Step 2 — fetch historical supply for each
    const histories = await Promise.all(
      filteredIds.map((id) =>
        fetch(`https://stablecoins.llama.fi/stablecoin/${id}`).then((r) => r.json())
      )
    );

    // Step 3 — sum by date
    const dailyTotals: Record<number, number> = {};
    for (const coin of histories) {
      for (const entry of coin.tokens ?? []) {
        const date: number = entry.date;
        const supply: number = entry.circulating?.peggedUSD ?? 0;
        dailyTotals[date] = (dailyTotals[date] ?? 0) + supply;
      }
    }

    const data = Object.entries(dailyTotals)
      .map(([date, totalUSD]) => ({ date: Number(date), totalUSD }))
      .sort((a, b) => a.date - b.date);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
