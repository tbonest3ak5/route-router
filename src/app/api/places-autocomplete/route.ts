import { NextRequest, NextResponse } from "next/server";
import { PlacePrediction } from "@/types";

interface GooglePrediction {
  description: string;
  place_id: string;
}

interface AutocompleteResponse {
  status: string;
  predictions: GooglePrediction[];
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    geometry?: {
      location: { lat: number; lng: number };
    };
  };
}

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const input = req.nextUrl.searchParams.get("input");
  const sessiontoken = req.nextUrl.searchParams.get("sessiontoken") ?? "";

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  // Step 1: Autocomplete
  const acUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  acUrl.searchParams.set("input", input);
  acUrl.searchParams.set("sessiontoken", sessiontoken);
  acUrl.searchParams.set("key", key);

  const acRes = await fetch(acUrl.toString());
  const acData = (await acRes.json()) as AutocompleteResponse;

  if (acData.status !== "OK" && acData.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: `Places API error: ${acData.status}` },
      { status: 502 }
    );
  }

  // Step 2: Resolve latlng for each prediction (parallel)
  const predictions: PlacePrediction[] = await Promise.all(
    (acData.predictions ?? []).slice(0, 5).map(async (p) => {
      const detailsUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/details/json"
      );
      detailsUrl.searchParams.set("place_id", p.place_id);
      detailsUrl.searchParams.set("fields", "geometry");
      detailsUrl.searchParams.set("sessiontoken", sessiontoken);
      detailsUrl.searchParams.set("key", key);

      const dRes = await fetch(detailsUrl.toString());
      const dData = (await dRes.json()) as PlaceDetailsResponse;
      const loc = dData.result?.geometry?.location ?? { lat: 0, lng: 0 };

      return {
        description: p.description,
        placeId: p.place_id,
        latlng: { lat: loc.lat, lng: loc.lng },
      };
    })
  );

  return NextResponse.json({ predictions });
}
