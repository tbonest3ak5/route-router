"use client";

import { RouteOptionCard } from "./RouteOptionCard";
import { Activity, DirectionsLegDetails, Friend, SolverResponse } from "@/types";
import { Clock } from "lucide-react";

interface Props {
  response: SolverResponse;
  activities: Activity[];
  friends: Friend[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  directionsLegs: DirectionsLegDetails[] | null;
}

export function RouteResultsPanel({
  response,
  activities,
  friends,
  selectedRouteIndex,
  onSelectRoute,
  directionsLegs,
}: Props) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Route Options
        </h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {response.solveTimeMs < 1000
            ? `${response.solveTimeMs}ms`
            : `${(response.solveTimeMs / 1000).toFixed(1)}s`}
        </span>
      </div>
      <div className="space-y-3">
        {response.routes.map((route, i) => (
          <RouteOptionCard
            key={route.variant}
            route={route}
            activities={activities}
            friends={friends}
            isSelected={selectedRouteIndex === i}
            onSelect={() => onSelectRoute(i)}
            legDetails={selectedRouteIndex === i ? directionsLegs : null}
          />
        ))}
      </div>
    </div>
  );
}
