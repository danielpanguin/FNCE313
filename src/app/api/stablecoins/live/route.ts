import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  try {
    const res = await fetch(
      "https://stablecoins.llama.fi/stablecoins?includePrices=true",
      { next: { revalidate: 300 } } // cache 5 min
    );
    if (!res.ok) throw new Error(`DeFi Llama responded ${res.status}`);

    const { peggedAssets } = await res.json();

    let total = 0;
    for (const asset of peggedAssets) {
      if (asset.pegType !== "peggedUSD" || asset.pegMechanism !== "fiat-backed") continue;
      // Use the canonical top-level circulating figure — same field the chart endpoint aggregates
      total += asset.circulating?.peggedUSD ?? 0;
    }

    return NextResponse.json(
      { totalBillions: +(total / 1e9).toFixed(2) },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
