"use client";

import { Bus, Footprints, Train } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration, formatTravelTime, minutesToTime } from "@/lib/time-utils";
import {
  Activity,
  DirectionsLegDetails,
  Friend,
  SolverRoute,
  TransitStepDetails,
} from "@/types";

const VARIANT_META: Record<
  SolverRoute["variant"],
  { label: string; className: string }
> = {
  shortest_time: {
    label: "Fastest",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  most_activities: {
    label: "Most Stops",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  },
  balanced: {
    label: "Balanced",
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300",
  },
};

function vehicleIcon(vehicleType?: string) {
  const t = vehicleType?.toUpperCase() ?? "";
  if (t.includes("BUS")) return <Bus className="h-3 w-3" />;
  if (t.includes("SUBWAY") || t.includes("METRO") || t.includes("RAIL") || t.includes("TRAIN"))
    return <Train className="h-3 w-3" />;
  if (t.includes("TRAM") || t.includes("STREETCAR"))
    return <Train className="h-3 w-3" />;
  return <Bus className="h-3 w-3" />;
}

interface TransitStepRowProps {
  step: TransitStepDetails;
}

function TransitStepRow({ step }: TransitStepRowProps) {
  if (step.mode === "WALKING") {
    return (
      <div className="flex items-center gap-2 py-1 pl-4">
        <div className="flex flex-col items-center w-4 shrink-0">
          <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
          <Footprints className="h-3 w-3 text-muted-foreground/60 my-0.5" />
          <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
        </div>
        <span className="text-xs text-muted-foreground">
          Walk {step.durationText}
          {step.distanceText ? ` (${step.distanceText})` : ""}
        </span>
      </div>
    );
  }

  // Transit step
  const bgColor = step.lineColor ?? "#6366F1";
  const textColor = step.lineTextColor ?? "#ffffff";

  return (
    <div className="flex items-start gap-2 py-1.5 pl-4">
      <div className="flex flex-col items-center w-4 shrink-0 mt-1">
        <div className="w-px h-2 border-l-2 border-dashed border-muted-foreground/40" />
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: bgColor }}
        />
        <div
          className="w-0.5 flex-1 min-h-[16px]"
          style={{ backgroundColor: bgColor, opacity: 0.4 }}
        />
      </div>
      <div className="flex-1 min-w-0">
        {/* Line badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold leading-none"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {vehicleIcon(step.vehicleType)}
            {step.lineShortName ?? step.lineName}
          </span>
          {step.headsign && (
            <span className="text-xs text-muted-foreground truncate">
              toward {step.headsign}
            </span>
          )}
        </div>
        {/* Stop info */}
        {step.departureStop && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            <span className="font-medium text-foreground/80">{step.departureStop}</span>
            {step.departureTimeText && (
              <span className="ml-1">at {step.departureTimeText}</span>
            )}
            {" → "}
            <span className="font-medium text-foreground/80">{step.arrivalStop}</span>
            {step.arrivalTimeText && (
              <span className="ml-1">at {step.arrivalTimeText}</span>
            )}
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

interface Props {
  route: SolverRoute;
  activities: Activity[];
  friends: Friend[];
  isSelected: boolean;
  onSelect: () => void;
  // Leg details only present for the currently rendered route
  legDetails?: DirectionsLegDetails[] | null;
}

export function RouteOptionCard({
  route,
  activities,
  friends,
  isSelected,
  onSelect,
  legDetails,
}: Props) {
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const friendMap = new Map(friends.map((f) => [f.id, f]));

  const totalTravelSeconds = route.stops.reduce(
    (sum, s) => sum + s.travelTimeFromPreviousSeconds,
    0
  );

  const meta = VARIANT_META[route.variant];

  // Leg index: leg[0] = start→stop[0], leg[i] = stop[i-1]→stop[i], leg[N] = stop[N-1]→end
  // We show the legs BEFORE each stop (leg[i] = before stop[i])
  const getLegBeforeStop = (stopIndex: number) =>
    legDetails?.[stopIndex] ?? null;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border bg-card cursor-pointer transition-all duration-150",
        "hover:shadow-md hover:border-primary/30",
        isSelected
          ? "border-primary shadow-md ring-1 ring-primary/20"
          : "border-border"
      )}
    >
      {/* Card header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              meta.className
            )}
          >
            {meta.label}
          </span>
          {isSelected && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              Selected
            </span>
          )}
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
        {route.stops.map((stop, i) => {
          const act = actMap.get(stop.activityId);
          const friend = act ? friendMap.get(act.friendId) : null;
          if (!act) return null;

          const legBefore = getLegBeforeStop(i);

          return (
            <div key={stop.activityId}>
              {/* Transit steps BEFORE this stop (the journey to get here) */}
              {legBefore && legBefore.steps.length > 0 && (
                <div className="border-l-2 border-dashed border-muted-foreground/20 ml-[9px]">
                  {legBefore.steps.map((step, si) => (
                    <TransitStepRow key={si} step={step} />
                  ))}
                </div>
              )}

              {/* Activity stop */}
              <div className="flex items-start gap-3 py-1.5">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div
                    className="w-[18px] h-[18px] rounded-full border-2 border-background shadow-sm shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: friend?.color ?? "#6366F1" }}
                  />
                  {i < route.stops.length - 1 && (
                    <div className="w-px h-2 bg-border/50 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{act.name}</span>
                    {act.required && (
                      <span className="text-amber-500 text-xs" title="Non-negotiable">★</span>
                    )}
                    {friend && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({friend.name})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="font-medium text-foreground/80">{minutesToTime(stop.arrivalMinutes)}</span>
                    <span>→</span>
                    <span className="font-medium text-foreground/80">{minutesToTime(stop.departureMinutes)}</span>
                    <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground/70">
                      {formatDuration(stop.departureMinutes - stop.arrivalMinutes)} here
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Last leg: last stop → end (leg index = stops.length) */}
        {legDetails?.[route.stops.length] && legDetails[route.stops.length].steps.length > 0 && (
          <div className="border-l-2 border-dashed border-muted-foreground/20 ml-[9px]">
            {legDetails[route.stops.length].steps.map((step, si) => (
              <TransitStepRow key={si} step={step} />
            ))}
          </div>
        )}

        {/* Excluded optionals */}
        {route.excludedActivityIds.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Skipped: </span>
              {route.excludedActivityIds.map((id) => actMap.get(id)?.name ?? id).join(", ")}
            </p>
          </div>
        )}

        {/* Hint for non-selected cards when no leg details */}
        {!isSelected && !legDetails && (
          <p className="text-xs text-muted-foreground/50 mt-1 italic">
            Select to see detailed transit steps
          </p>
        )}
      </div>
    </div>
  );
}
