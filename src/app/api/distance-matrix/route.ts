import { NextRequest, NextResponse } from "next/server";

interface LatLng {
  lat: number;
  lng: number;
}

interface RequestBody {
  origins: LatLng[];
  destinations: LatLng[];
  mode: "driving" | "transit";
  /** Unix timestamp for transit departure scheduling */
  departureTimestamp?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const originsStr = body.origins
    .map((o) => `${o.lat},${o.lng}`)
    .join("|");
  const destsStr = body.destinations
    .map((d) => `${d.lat},${d.lng}`)
    .join("|");

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json"
  );
  url.searchParams.set("origins", originsStr);
  url.searchParams.set("destinations", destsStr);
  url.searchParams.set("mode", body.mode);
  // Transit requires departure_time for accurate durations; use provided timestamp or now
  if (body.mode === "transit") {
    const ts = body.departureTimestamp ?? Math.floor(Date.now() / 1000);
    url.searchParams.set("departure_time", String(ts));
  }
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = await res.json() as {
    status: string;
    rows: Array<{ elements: Array<{ status: string; duration: { value: number } }> }>;
  };

  if (data.status !== "OK") {
    return NextResponse.json(
      { error: `Google API error: ${data.status}` },
      { status: 502 }
    );
  }

  const durationSeconds = data.rows.map((row) =>
    row.elements.map((el) =>
      el.status === "OK" ? el.duration.value : 99999
    )
  );

  return NextResponse.json({ durationSeconds });
}
