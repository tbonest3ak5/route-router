"use client";

import { useCallback, useEffect, useState } from "react";

import { getTripConfig, saveTripConfig } from "@/lib/storage";
import { TripConfig } from "@/types";

export function useTripConfig() {
  const [tripConfig, setTripConfig] = useState<TripConfig | null>(null);

  useEffect(() => {
    setTripConfig(getTripConfig());
  }, []);

  const updateTripConfig = useCallback((config: TripConfig) => {
    setTripConfig(config);
    saveTripConfig(config);
  }, []);

  return { tripConfig, updateTripConfig };
}
