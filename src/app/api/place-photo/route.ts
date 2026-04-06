import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const name = searchParams.get("name") ?? "";

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Step 1: nearby search — keyword improves relevance, no type filter keeps it broad
  const nearbyUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  nearbyUrl.searchParams.set("location", `${lat},${lng}`);
  nearbyUrl.searchParams.set("rankby", "distance");
  if (name) nearbyUrl.searchParams.set("keyword", name);
  else nearbyUrl.searchParams.set("type", "point_of_interest");
  nearbyUrl.searchParams.set("key", key);

  const nearbyRes = await fetch(nearbyUrl.toString(), { cache: "no-store" });
  const nearbyData = nearbyRes.ok ? await nearbyRes.json() : null;

  // Step 2: grab the first photo from the first result
  const results: { photos?: { photo_reference: string }[] }[] = nearbyData?.results ?? [];
  const photoRef: string | undefined = results[0]?.photos?.[0]?.photo_reference;

  // Step 3: fall back to static map if nothing found
  if (!photoRef) {
    const staticUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
    staticUrl.searchParams.set("center", `${lat},${lng}`);
    staticUrl.searchParams.set("zoom", "16");
    staticUrl.searchParams.set("size", "480x200");
    staticUrl.searchParams.set("scale", "2");
    staticUrl.searchParams.set("markers", `color:red|${lat},${lng}`);
    staticUrl.searchParams.set("key", key);

    const staticRes = await fetch(staticUrl.toString(), { cache: "no-store" });
    if (!staticRes.ok) {
      return NextResponse.json({ error: "Static Maps error" }, { status: 502 });
    }
    const buffer = await staticRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": staticRes.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Step 4: fetch the actual place photo
  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", "480");
  photoUrl.searchParams.set("photo_reference", photoRef);
  photoUrl.searchParams.set("key", key);

  const photoRes = await fetch(photoUrl.toString(), { cache: "no-store" });
  if (!photoRes.ok) {
    return NextResponse.json({ error: "Photo fetch error" }, { status: 502 });
  }

  const buffer = await photoRes.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": photoRes.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
