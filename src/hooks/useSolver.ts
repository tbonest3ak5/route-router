"use client";

import { useCallback, useState } from "react";

import { callSolver } from "@/lib/solver-client";
import { timeToMinutes } from "@/lib/time-utils";
import {
  Activity,
  LatLng,
  SolverRequest,
  SolverResponse,
  TripConfig,
} from "@/types";

async function fetchDistanceMatrix(
  nodes: LatLng[],
  mode: "driving" | "transit"
): Promise<number[][]> {
  const res = await fetch("/api/distance-matrix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origins: nodes, destinations: nodes, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Distance matrix error ${res.status}`);
  }
  const data = await res.json() as { durationSeconds: number[][] };
  return data.durationSeconds;
}

export function useSolver() {
  const [response, setResponse] = useState<SolverResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const solve = useCallback(
    async (activities: Activity[], tripConfig: TripConfig) => {
      setIsLoading(true);
      setError(null);
      setResponse(null);
      setSelectedRouteIndex(0);

      try {
        // Build ordered node list: depot_start, depot_end, then activities
        const nodeIds = [
          "depot_start",
          "depot_end",
          ...activities.map((a) => a.id),
        ];
        const nodes: LatLng[] = [
          tripConfig.startLatLng,
          tripConfig.endLatLng,
          ...activities.map((a) => a.latlng),
        ];

        const durationSeconds = await fetchDistanceMatrix(
          nodes,
          tripConfig.travelMode
        );

        const request: SolverRequest = {
          tripConfig: {
            startLatLng: tripConfig.startLatLng,
            endLatLng: tripConfig.endLatLng,
            startTimeMinutes: timeToMinutes(tripConfig.startTime),
            endTimeMinutes: timeToMinutes(tripConfig.endTime),
            travelMode: tripConfig.travelMode,
          },
          activities: activities.map((a) => ({
            id: a.id,
            name: a.name,
            latlng: a.latlng,
            minDurationMinutes: a.minDurationMinutes,
            required: a.required,
            friendId: a.friendId,
          })),
          travelMatrix: { nodeIds, durationSeconds },
        };

        const result = await callSolver(request);
        setResponse(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    solve,
    response,
    isLoading,
    error,
    selectedRouteIndex,
    setSelectedRouteIndex,
  };
}
