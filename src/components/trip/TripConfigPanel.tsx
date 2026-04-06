"use client";

import { useState } from "react";

import { PlacesCombobox } from "@/components/activities/PlacesCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LatLng, PlacePrediction, TripConfig } from "@/types";
import { Car, Loader2, Navigation, Train } from "lucide-react";

interface Props {
  tripConfig: TripConfig | null;
  onConfigChange: (config: TripConfig) => void;
  onSolve: () => void;
  isSolving: boolean;
  canSolve: boolean;
}

export function TripConfigPanel({
  tripConfig,
  onConfigChange,
  onSolve,
  isSolving,
  canSolve,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [startAddress, setStartAddress] = useState(tripConfig?.startAddress ?? "");
  const [startLatLng, setStartLatLng] = useState<LatLng | null>(tripConfig?.startLatLng ?? null);
  const [startTime, setStartTime] = useState(tripConfig?.startTime ?? "09:00");
  const [endAddress, setEndAddress] = useState(tripConfig?.endAddress ?? "");
  const [endLatLng, setEndLatLng] = useState<LatLng | null>(tripConfig?.endLatLng ?? null);
  const [endTime, setEndTime] = useState(tripConfig?.endTime ?? "18:00");
  const [travelMode, setTravelMode] = useState<"driving" | "transit">(
    tripConfig?.travelMode ?? "driving"
  );
  const [date, setDate] = useState(tripConfig?.date ?? today);

  const handleStartSelect = (p: PlacePrediction) => {
    setStartAddress(p.description);
    setStartLatLng(p.latlng);
    emit({ startAddress: p.description, startLatLng: p.latlng });
  };

  const handleEndSelect = (p: PlacePrediction) => {
    setEndAddress(p.description);
    setEndLatLng(p.latlng);
    emit({ endAddress: p.description, endLatLng: p.latlng });
  };

  const emit = (overrides: Partial<TripConfig>) => {
    if (!startLatLng && !overrides.startLatLng) return;
    if (!endLatLng && !overrides.endLatLng) return;
    onConfigChange({
      startAddress: overrides.startAddress ?? startAddress,
      startLatLng: overrides.startLatLng ?? startLatLng!,
      startTime: overrides.startTime ?? startTime,
      endAddress: overrides.endAddress ?? endAddress,
      endLatLng: overrides.endLatLng ?? endLatLng!,
      endTime: overrides.endTime ?? endTime,
      travelMode: overrides.travelMode ?? travelMode,
      date: overrides.date ?? date,
    });
  };

  const isConfigured = !!startLatLng && !!endLatLng;

  return (
    <div className="px-4 py-4">
      <h2 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
        Trip Config
      </h2>

      <div className="space-y-3">
        {/* Start / End row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start location</Label>
            <PlacesCombobox
              value={startAddress}
              onSelect={handleStartSelect}
              placeholder="Start here…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End location</Label>
            <PlacesCombobox
              value={endAddress}
              onSelect={handleEndSelect}
              placeholder="End here…"
            />
          </div>
        </div>

        {/* Times row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); emit({ startTime: e.target.value }); }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Must arrive by</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); emit({ endTime: e.target.value }); }}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Date + Mode row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); emit({ date: e.target.value }); }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Travel mode</Label>
            <Select
              value={travelMode}
              onValueChange={(v) => {
                const mode = v as "driving" | "transit";
                setTravelMode(mode);
                emit({ travelMode: mode });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driving">
                  <span className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" /> Driving
                  </span>
                </SelectItem>
                <SelectItem value="transit">
                  <span className="flex items-center gap-1.5">
                    <Train className="h-3.5 w-3.5" /> Transit
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button
          onClick={onSolve}
          disabled={!canSolve || !isConfigured || isSolving}
          className="w-full"
          size="sm"
        >
          {isSolving ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Planning route…
            </>
          ) : (
            "Plan Trip"
          )}
        </Button>

        {!isConfigured && !isSolving && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Set start and end locations above
          </p>
        )}
        {isConfigured && !canSolve && !isSolving && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Add at least one activity to plan
          </p>
        )}
      </div>
    </div>
  );
}
