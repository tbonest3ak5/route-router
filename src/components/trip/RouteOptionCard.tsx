"use client";

import { Bus, Car, Footprints, Train } from "lucide-react";

import { formatDuration, formatTravelTime, minutesToTimeAMPM, timeToMinutes } from "@/lib/time-utils";
import {
  Activity,
  DirectionsLegDetails,
  Friend,
  ScheduledStop,
  SolverRoute,
  TransitStepDetails,
  TripConfig,
} from "@/types";

function getLocationName(address: string): string {
  return address.split(",")[0].trim();
}

function vehicleIcon(vehicleType?: string) {
  const t = vehicleType?.toUpperCase() ?? "";
  if (t.includes("BUS")) return <Bus className="h-3 w-3" />;
  if (t.includes("SUBWAY") || t.includes("METRO") || t.includes("RAIL") || t.includes("TRAIN"))
    return <Train className="h-3 w-3" />;
  if (t.includes("TRAM") || t.includes("STREETCAR"))
    return <Train className="h-3 w-3" />;
  return <Bus className="h-3 w-3" />;
}

// ── Driving leg summary ────────────────────────────────────────────────────────

function DrivingLegRow({ leg }: { leg: DirectionsLegDetails }) {
  if (!leg.durationText && !leg.durationSeconds) return null;
  const text = leg.durationText ?? `${Math.round((leg.durationSeconds ?? 0) / 60)} min`;
  return (
    <div className="flex items-center gap-2 py-1 pl-4">
      <div className="flex flex-col items-center w-4 shrink-0">
        <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/30" />
        <Car className="h-3 w-3 text-muted-foreground/50 my-0.5" />
        <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/30" />
      </div>
      <span className="text-xs text-muted-foreground">
        Drive {text}{leg.distanceText ? ` · ${leg.distanceText}` : ""}
      </span>
    </div>
  );
}

// ── Transit step row ───────────────────────────────────────────────────────────

function TransitStepRow({ step }: { step: TransitStepDetails }) {
  if (step.mode === "WALKING") {
    return (
      <div className="flex items-center gap-2 py-1 pl-4">
        <div className="flex flex-col items-center w-4 shrink-0">
          <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
          <Footprints className="h-3 w-3 text-muted-foreground/60 my-0.5" />
          <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
        </div>
        <span className="text-xs text-muted-foreground">
          Walk {step.durationText}{step.distanceText ? ` (${step.distanceText})` : ""}
        </span>
      </div>
    );
  }

  const bgColor = step.lineColor ?? "#6366F1";
  const textColor = step.lineTextColor ?? "#ffffff";

  return (
    <div className="flex items-start gap-2 py-1.5 pl-4">
      <div className="flex flex-col items-center w-4 shrink-0 mt-1">
        <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bgColor }} />
        <div className="w-0.5 flex-1 min-h-[16px]" style={{ backgroundColor: bgColor, opacity: 0.4 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold leading-none"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {vehicleIcon(step.vehicleType)}
            {step.lineShortName ?? step.lineName}
          </span>
          {step.headsign && (
            <span className="text-xs text-muted-foreground truncate">toward {step.headsign}</span>
          )}
        </div>
        {step.departureStop && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            <span className="font-medium text-foreground/80">{step.departureStop}</span>
            {step.departureTimeText && <span className="ml-1">at {step.departureTimeText}</span>}
            {" → "}
            <span className="font-medium text-foreground/80">{step.arrivalStop}</span>
            {step.arrivalTimeText && <span className="ml-1">at {step.arrivalTimeText}</span>}
          </div>
        )}
        {step.numStops != null && (
          <div className="text-xs text-muted-foreground">
            {step.numStops} {step.numStops === 1 ? "stop" : "stops"} · {step.durationText}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recompute stop times from actual leg durations (for transit) ───────────────

interface RecomputedStop {
  arrivalMinutes: number;
  departureMinutes: number;
}

function recomputeTransitTimes(
  stops: ScheduledStop[],
  actMap: Map<string, Activity>,
  startMinutes: number,
  legDetails: DirectionsLegDetails[]
): RecomputedStop[] {
  const result: RecomputedStop[] = [];
  let cursor = startMinutes;

  for (let i = 0; i < stops.length; i++) {
    const legDurationMin = legDetails[i]?.durationSeconds != null
      ? legDetails[i].durationSeconds! / 60
      : stops[i].travelTimeFromPreviousSeconds / 60;

    cursor += legDurationMin;
    const arrivalMinutes = Math.round(cursor);
    const actDuration = actMap.get(stops[i].activityId)?.minDurationMinutes
      ?? (stops[i].departureMinutes - stops[i].arrivalMinutes);
    const departureMinutes = arrivalMinutes + actDuration;
    result.push({ arrivalMinutes, departureMinutes });
    cursor = departureMinutes;
  }

  return result;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  route: SolverRoute;
  activities: Activity[];
  friends: Friend[];
  isSelected: boolean;
  onSelect: () => void;
  legDetails?: DirectionsLegDetails[] | null;
  tripConfig?: TripConfig | null;
}

export function RouteOptionCard({
  route,
  activities,
  friends,
  isSelected,
  onSelect,
  legDetails,
  tripConfig,
}: Props) {
  const startMinutes = tripConfig ? timeToMinutes(tripConfig.startTime) : 0;
  const endMinutes = tripConfig ? timeToMinutes(tripConfig.endTime) : 0;
  const travelMode = tripConfig?.travelMode ?? "driving";
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const friendMap = new Map(friends.map((f) => [f.id, f]));

  const startTimeName = tripConfig ? getLocationName(tripConfig.startAddress) : "Start";
  const endTimeName = tripConfig ? getLocationName(tripConfig.endAddress) : "End";

  const totalTravelSeconds = route.stops.reduce(
    (sum, s) => sum + s.travelTimeFromPreviousSeconds,
    0
  );

  // For transit: recompute stop times from actual DirectionsService leg durations.
  // The solver's matrix was computed at trip start time and may not match real transit
  // schedules at the time each leg actually departs.
  const recomputedStops: RecomputedStop[] | null =
    travelMode === "transit" && legDetails && legDetails.length > 0
      ? recomputeTransitTimes(route.stops, actMap, startMinutes, legDetails)
      : null;

  // Actual arrival at end depot = last stop departure + last leg travel time
  const lastStopDep = recomputedStops
    ? recomputedStops[recomputedStops.length - 1]?.departureMinutes
    : route.stops[route.stops.length - 1]?.departureMinutes;
  const lastLegSec = legDetails?.[route.stops.length]?.durationSeconds;
  const actualEndArrivalMinutes =
    lastStopDep != null && lastLegSec != null
      ? Math.round(lastStopDep + lastLegSec / 60)
      : null;

  const getStopTimes = (i: number): RecomputedStop =>
    recomputedStops?.[i] ?? {
      arrivalMinutes: route.stops[i].arrivalMinutes,
      departureMinutes: route.stops[i].departureMinutes,
    };

  // Returns the leg arriving at stop[i]; null for i=0 (shown above the loop already)
  const getLegBeforeStop = (i: number) => (i > 0 ? legDetails?.[i] : null);

  return (
    <div
      onClick={onSelect}
      className="rounded-xl border bg-card transition-all duration-150 border-primary shadow-md cursor-pointer"
    >
      {/* Card header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-primary text-primary-foreground">
            Optimal Route
          </span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{route.stops.length} {route.stops.length === 1 ? "stop" : "stops"}</span>
          <span>·</span>
          <span>{formatTravelTime(totalTravelSeconds)} transit</span>
          <span>·</span>
          <span>{formatDuration(route.totalDurationMinutes)} total</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-3 pb-3">
        {/* Start */}
        <div className="flex items-start gap-3 py-1.5">
          <div className="flex flex-col items-center shrink-0 mt-1">
            <div className="w-[18px] h-[18px] rounded-full border-2 border-background shadow-sm bg-green-500" />
            <div className="w-px h-2 bg-border/50 mt-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              Depart {startTimeName}
            </span>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{minutesToTimeAMPM(startMinutes)}</span>
            </div>
          </div>
        </div>

        {/* First leg: start → stop[0] */}
        {legDetails?.[0] && (
          travelMode === "driving"
            ? <DrivingLegRow leg={legDetails[0]} />
            : legDetails[0].steps.length > 0 && (
                <div className="border-l-2 border-dashed border-muted-foreground/20 ml-[9px]">
                  {legDetails[0].steps.map((step, si) => <TransitStepRow key={si} step={step} />)}
                </div>
              )
        )}

        {route.stops.map((stop, i) => {
          const act = actMap.get(stop.activityId);
          const friend = act ? friendMap.get(act.friendId) : null;
          if (!act) return null;

          const legBefore = getLegBeforeStop(i);
          const { arrivalMinutes, departureMinutes } = getStopTimes(i);

          return (
            <div key={stop.activityId}>
              {/* Travel to this stop (skip i=0, already shown above) */}
              {legBefore && (
                travelMode === "driving"
                  ? <DrivingLegRow leg={legBefore} />
                  : legBefore.steps.length > 0 && (
                      <div className="border-l-2 border-dashed border-muted-foreground/20 ml-[9px]">
                        {legBefore.steps.map((step, si) => <TransitStepRow key={si} step={step} />)}
                      </div>
                    )
              )}

              {/* Activity stop */}
              <div className="flex items-start gap-3 py-1.5">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div
                    className="w-[18px] h-[18px] rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: friend?.color ?? "#6366F1" }}
                  />
                  {i < route.stops.length - 1 && (
                    <div className="w-px h-2 bg-border/50 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{act.name}</span>
                    {act.required && <span className="text-amber-500 text-xs" title="Non-negotiable">★</span>}
                    {friend && (
                      <span className="text-xs text-muted-foreground shrink-0">({friend.name})</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="font-medium text-foreground/80">{minutesToTimeAMPM(arrivalMinutes)}</span>
                    <span>→</span>
                    <span className="font-medium text-foreground/80">{minutesToTimeAMPM(departureMinutes)}</span>
                    <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground/70">
                      {formatDuration(departureMinutes - arrivalMinutes)} here
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Last leg: stop[N-1] → end */}
        {legDetails?.[route.stops.length] && (
          travelMode === "driving"
            ? <DrivingLegRow leg={legDetails[route.stops.length]} />
            : legDetails[route.stops.length].steps.length > 0 && (
                <div className="border-l-2 border-dashed border-muted-foreground/20 ml-[9px]">
                  {legDetails[route.stops.length].steps.map((step, si) => (
                    <TransitStepRow key={si} step={step} />
                  ))}
                </div>
              )
        )}

        {/* End */}
        <div className="flex items-start gap-3 py-1.5">
          <div className="flex flex-col items-center shrink-0 mt-1">
            <div className="w-px h-2 bg-border/50 mb-0.5" />
            <div className="w-[18px] h-[18px] rounded-full border-2 border-background shadow-sm bg-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              Arrive {endTimeName}
            </span>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {actualEndArrivalMinutes != null
                  ? minutesToTimeAMPM(actualEndArrivalMinutes)
                  : minutesToTimeAMPM(endMinutes)}
              </span>
              {actualEndArrivalMinutes != null && actualEndArrivalMinutes > endMinutes && (
                <span className="ml-1.5 text-amber-500">(past planned end)</span>
              )}
            </div>
          </div>
        </div>

        {/* Excluded optionals */}
        {route.excludedActivityIds.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Skipped: </span>
              {route.excludedActivityIds.map((id) => actMap.get(id)?.name ?? id).join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
