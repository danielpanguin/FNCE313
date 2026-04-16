import { NextResponse } from "next/server";

export const maxDuration = 30;

// GET /api/fred?series=DTB3
// GET /api/fred?series=WMTSNS&limit=60
// Returns: { value: number, date: string, series: string }
//   or for limit > 1: { observations: { value: number, date: string }[], series: string }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get("series");
  const limit  = Number(searchParams.get("limit") ?? "5");

  if (!series) {
    return NextResponse.json({ error: "Missing required param: series" }, { status: 400 });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FRED_API_KEY not configured" }, { status: 500 });
  }

  try {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id",   series);
    url.searchParams.set("api_key",     apiKey);
    url.searchParams.set("sort_order",  "desc");
    url.searchParams.set("limit",       String(limit));
    url.searchParams.set("file_type",   "json");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`FRED responded ${res.status}`);

    const { observations } = await res.json() as {
      observations: { date: string; value: string }[];
    };

    // Filter out missing-data placeholders (".")
    const valid = observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: parseFloat(o.value) }));

    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid observations returned" }, { status: 502 });
    }

    // Single value requested — return flat object for convenience
    if (limit <= 5) {
      return NextResponse.json(
        { value: valid[0].value, date: valid[0].date, series },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }

    // Multiple observations — return array
    return NextResponse.json(
      { observations: valid, series },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
