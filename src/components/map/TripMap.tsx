"use client";

import { useEffect, useRef } from "react";

import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import {
  Activity,
  DirectionsLegDetails,
  Friend,
  LatLng,
  SolverRoute,
  TransitStepDetails,
  TravelMode,
} from "@/types";

interface Props {
  activities: Activity[];
  friends: Friend[];
  selectedRoute: SolverRoute | null;
  travelMode: TravelMode;
  startLatLng?: LatLng;
  endLatLng?: LatLng;
  /** Combined date + start time for transit departure scheduling */
  tripStartDate?: Date;
  onDirectionsLegs?: (legs: DirectionsLegDetails[]) => void;
}

function extractStepDetails(step: google.maps.DirectionsStep): TransitStepDetails {
  const mode = step.travel_mode as "WALKING" | "TRANSIT";
  const base: TransitStepDetails = {
    mode,
    durationText: step.duration?.text ?? "",
    distanceText: step.distance?.text,
    instructions: step.instructions?.replace(/<[^>]*>/g, "") ?? "",
  };

  if (mode === "TRANSIT" && step.transit) {
    const t = step.transit;
    const line = t.line;
    const rawColor = line.color ?? "";
    base.lineColor = rawColor.startsWith("#") ? rawColor : rawColor ? `#${rawColor}` : undefined;
    const rawText = line.text_color ?? "";
    base.lineTextColor = rawText.startsWith("#") ? rawText : rawText ? `#${rawText}` : "#ffffff";
    base.lineName = line.name;
    base.lineShortName = line.short_name;
    base.vehicleType = line.vehicle?.type;
    base.vehicleName = line.vehicle?.name;
    base.departureStop = t.departure_stop?.name;
    base.arrivalStop = t.arrival_stop?.name;
    base.departureTimeText = t.departure_time?.text;
    base.arrivalTimeText = t.arrival_time?.text;
    base.numStops = t.num_stops;
    base.headsign = t.headsign;
  }
  return base;
}

function fetchOneLeg(
  svc: google.maps.DirectionsService,
  origin: google.maps.LatLng,
  destination: google.maps.LatLng,
  mode: google.maps.TravelMode,
  departureTime: Date
): Promise<google.maps.DirectionsResult | null> {
  return new Promise((resolve) => {
    svc.route(
      {
        origin,
        destination,
        travelMode: mode,
        optimizeWaypoints: false,
        ...(mode === google.maps.TravelMode.TRANSIT
          ? { transitOptions: { departureTime } }
          : {}),
      },
      (result, status) => {
        resolve(status === google.maps.DirectionsStatus.OK && result ? result : null);
      }
    );
  });
}

export function TripMap({
  activities,
  friends,
  selectedRoute,
  travelMode,
  startLatLng,
  endLatLng,
  tripStartDate,
  onDirectionsLegs,
}: Props) {
  const mapsLoaded = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const transitPolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 43.651, lng: -79.347 },
      mapId: "DEMO_MAP_ID",
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
    });

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#2d6a5e",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    });
    directionsRendererRef.current.setMap(mapInstanceRef.current);
  }, [mapsLoaded]);

  // Update activity + depot markers
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const friendMap = new Map(friends.map((f) => [f.id, f]));

    const addDepotMarker = (latlng: LatLng, glyph: string, title: string) => {
      const pin = new google.maps.marker.PinElement({
        glyph,
        background: "#1a3a35",
        borderColor: "#1a3a35",
        glyphColor: "#ffffff",
        scale: 1.15,
      });
      const m = new google.maps.marker.AdvancedMarkerElement({
        position: latlng,
        map: mapInstanceRef.current,
        content: pin.element,
        title,
      });
      markersRef.current.push(m);
      bounds.extend(latlng);
    };

    // Show depot markers only when we have a selected route
    if (selectedRoute && startLatLng) addDepotMarker(startLatLng, "S", "Start");
    if (
      selectedRoute &&
      endLatLng &&
      (endLatLng.lat !== startLatLng?.lat || endLatLng.lng !== startLatLng?.lng)
    ) {
      addDepotMarker(endLatLng, "E", "End");
    }

    activities.forEach((act) => {
      const friend = friendMap.get(act.friendId);
      const color = friend?.color ?? "#2d6a5e";

      const pin = new google.maps.marker.PinElement({
        background: color,
        borderColor: color,
        glyphColor: "#ffffff",
        scale: act.required ? 1.25 : 1.0,
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: act.latlng,
        map: mapInstanceRef.current,
        content: pin.element,
        title: act.name,
      });

      const dur = act.minDurationMinutes;
      const durStr =
        dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 ? ` ${dur % 60}m` : ""}` : `${dur}m`;

      const photoUrl = `/api/place-photo?lat=${act.latlng.lat}&lng=${act.latlng.lng}&name=${encodeURIComponent(act.name)}`;
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;font-size:13px;max-width:220px">
          <img src="${photoUrl}" alt="" style="width:100%;border-radius:6px;margin-bottom:6px;display:block" />
          <div style="font-weight:600;margin-bottom:2px">${act.name}</div>
          <div style="color:#6b7280">${durStr} minimum</div>
          <div style="color:#6b7280">${friend?.name ?? ""}</div>
          ${act.required ? '<div style="color:#d97706;font-size:11px;margin-top:3px">★ Non-negotiable</div>' : ""}
        </div>`,
      });
      marker.addListener("click", () =>
        infoWindow.open(mapInstanceRef.current, marker)
      );

      markersRef.current.push(marker);
      bounds.extend(act.latlng);
    });

    if (!bounds.isEmpty()) mapInstanceRef.current.fitBounds(bounds, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, activities, friends, selectedRoute, startLatLng, endLatLng]);

  // Draw route
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current) return;

    // Clear previous route graphics
    transitPolylinesRef.current.forEach((p) => p.setMap(null));
    transitPolylinesRef.current = [];
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({
        routes: [],
      } as unknown as google.maps.DirectionsResult);
    }

    if (!selectedRoute || selectedRoute.stops.length === 0) return;

    const actMap = new Map(activities.map((a) => [a.id, a]));
    const orderedStops = selectedRoute.stops
      .map((s) => actMap.get(s.activityId))
      .filter(Boolean) as Activity[];

    if (orderedStops.length === 0) return;

    const toLatLng = (ll: LatLng) => new google.maps.LatLng(ll.lat, ll.lng);
    const origin = startLatLng ? toLatLng(startLatLng) : toLatLng(orderedStops[0].latlng);
    const destination = endLatLng
      ? toLatLng(endLatLng)
      : toLatLng(orderedStops[orderedStops.length - 1].latlng);

    const gmMode =
      travelMode === "transit"
        ? google.maps.TravelMode.TRANSIT
        : google.maps.TravelMode.DRIVING;

    const svc = new google.maps.DirectionsService();
    const baseDate = tripStartDate ?? new Date();

    if (travelMode === "driving") {
      // Driving: single request with all waypoints
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: gmMode,
        optimizeWaypoints: false,
        waypoints: orderedStops.slice(0, 8).map((act) => ({
          location: toLatLng(act.latlng),
          stopover: true,
        })),
      };

      new google.maps.DirectionsService().route(request, (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) return;
        directionsRendererRef.current!.setDirections(result);
        if (onDirectionsLegs) {
          onDirectionsLegs(
            result.routes[0].legs.map((leg) => ({
              durationText: leg.duration?.text,
              durationSeconds: leg.duration?.value,
              distanceText: leg.distance?.text,
              steps: leg.steps.map(extractStepDetails),
            }))
          );
        }
      });
    } else {
      // Transit: one request per leg (Google transit API does NOT support waypoints)
      const legOrigins = [
        origin,
        ...orderedStops.map((s) => toLatLng(s.latlng)),
      ];
      const legDests = [
        ...orderedStops.map((s) => toLatLng(s.latlng)),
        destination,
      ];

      const promises = legOrigins.map((legOrigin, i) => {
        // Use the solver's departure time for each leg so transit matches
        let deptTime = new Date(baseDate);
        if (i > 0 && selectedRoute.stops[i - 1]) {
          const depMin = selectedRoute.stops[i - 1].departureMinutes;
          deptTime = new Date(baseDate);
          deptTime.setHours(Math.floor(depMin / 60));
          deptTime.setMinutes(depMin % 60);
          deptTime.setSeconds(0);
        }
        return fetchOneLeg(svc, legOrigin, legDests[i], gmMode, deptTime);
      });

      Promise.all(promises).then((results) => {
        results.forEach((r) => {
          if (r) drawTransitPolylines(r);
        });
        if (onDirectionsLegs) {
          onDirectionsLegs(
            results.map((r) => {
              const leg = r?.routes[0]?.legs[0];
              return leg
                ? {
                    durationText: leg.duration?.text,
                    durationSeconds: leg.duration?.value,
                    distanceText: leg.distance?.text,
                    steps: leg.steps.map(extractStepDetails),
                  }
                : { steps: [] };
            })
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, selectedRoute, travelMode, activities, startLatLng, endLatLng, tripStartDate, onDirectionsLegs]);

  function drawTransitPolylines(result: google.maps.DirectionsResult) {
    const map = mapInstanceRef.current!;
    result.routes[0]?.legs[0]?.steps.forEach((step) => {
      if (!step.polyline?.points) return;
      const path = google.maps.geometry.encoding.decodePath(step.polyline.points);
      const isTransit = step.travel_mode === "TRANSIT";
      const rawColor = isTransit ? (step.transit?.line?.color ?? "") : "";
      const lineColor = rawColor
        ? rawColor.startsWith("#") ? rawColor : `#${rawColor}`
        : isTransit ? "#2d6a5e" : "#6B7280";

      if (isTransit) {
        transitPolylinesRef.current.push(
          new google.maps.Polyline({
            path,
            map,
            strokeColor: lineColor,
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 2,
          })
        );
      } else {
        // Dashed walking line
        transitPolylinesRef.current.push(
          new google.maps.Polyline({
            path,
            map,
            strokeColor: "#6B7280",
            strokeWeight: 3,
            strokeOpacity: 0,
            zIndex: 1,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 0.7,
                  strokeColor: "#6B7280",
                  scale: 3,
                },
                offset: "0",
                repeat: "14px",
              },
            ],
          })
        );
      }
    });
  }

  return (
    <div className="relative w-full h-full bg-muted/20">
      <div ref={mapRef} className="w-full h-full" />
      {!mapsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Map Legend */}
      {mapsLoaded && selectedRoute && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-lg p-3 text-xs">
          <div className="font-semibold text-foreground mb-2">Legend</div>
          <div className="space-y-1.5">
            {travelMode === "driving" ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 rounded-full bg-[#2d6a5e]" />
                <span className="text-muted-foreground">Driving route</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1.5 rounded-full bg-[#2d6a5e]" />
                  <span className="text-muted-foreground">Transit (color = line)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" />
                  <span className="text-muted-foreground">Walking</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#1a3a35] flex items-center justify-center text-white text-[8px] font-bold">S</div>
              <span className="text-muted-foreground">Start / End</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
