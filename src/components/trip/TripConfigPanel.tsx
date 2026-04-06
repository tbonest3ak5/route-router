"use client";

import { useState, useEffect } from "react";

import { PlacesCombobox } from "@/components/activities/PlacesCombobox";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LatLng, PlacePrediction, TripConfig } from "@/types";
import { Car, Loader2, Train, MapPin, Clock, Calendar } from "lucide-react";

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
  const today = new Date();

  const [startAddress, setStartAddress] = useState(tripConfig?.startAddress ?? "");
  const [startLatLng, setStartLatLng] = useState<LatLng | null>(tripConfig?.startLatLng ?? null);
  const [startTime, setStartTime] = useState(tripConfig?.startTime ?? "09:00");
  const [endAddress, setEndAddress] = useState(tripConfig?.endAddress ?? "");
  const [endLatLng, setEndLatLng] = useState<LatLng | null>(tripConfig?.endLatLng ?? null);
  const [endTime, setEndTime] = useState(tripConfig?.endTime ?? "18:00");
  const [travelMode, setTravelMode] = useState<"driving" | "transit">(
    tripConfig?.travelMode ?? "driving"
  );
  const [date, setDate] = useState<Date | undefined>(
    tripConfig?.date ? new Date(tripConfig.date + "T00:00:00") : today
  );

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
    const dateStr = overrides.date ?? (date ? date.toISOString().split("T")[0] : today.toISOString().split("T")[0]);
    onConfigChange({
      startAddress: overrides.startAddress ?? startAddress,
      startLatLng: overrides.startLatLng ?? startLatLng!,
      startTime: overrides.startTime ?? startTime,
      endAddress: overrides.endAddress ?? endAddress,
      endLatLng: overrides.endLatLng ?? endLatLng!,
      endTime: overrides.endTime ?? endTime,
      travelMode: overrides.travelMode ?? travelMode,
      date: dateStr,
    });
  };

  const isConfigured = !!startLatLng && !!endLatLng;

  return (
    <div className="px-5 py-5">
      <div className="space-y-5">
        {/* Locations Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <MapPin className="h-3.5 w-3.5" />
            Locations
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Starting point</Label>
              <PlacesCombobox
                value={startAddress}
                onSelect={handleStartSelect}
                placeholder="Where are you starting from?"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ending point</Label>
              <PlacesCombobox
                value={endAddress}
                onSelect={handleEndSelect}
                placeholder="Where do you need to end up?"
              />
            </div>
          </div>
        </div>

        {/* Date Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Calendar className="h-3.5 w-3.5" />
            Date
          </div>
          <DatePicker
            date={date}
            onDateChange={(newDate) => {
              setDate(newDate);
              if (newDate) {
                emit({ date: newDate.toISOString().split("T")[0] });
              }
            }}
            placeholder="Select trip date"
          />
        </div>

        {/* Times Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Clock className="h-3.5 w-3.5" />
            Schedule
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Depart at</Label>
              <TimePicker
                value={startTime}
                onChange={(v) => { setStartTime(v); emit({ startTime: v }); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Return by</Label>
              <TimePicker
                value={endTime}
                onChange={(v) => { setEndTime(v); emit({ endTime: v }); }}
              />
            </div>
          </div>
        </div>

        {/* Travel Mode */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Car className="h-3.5 w-3.5" />
            Travel Mode
          </div>
          <Select
            value={travelMode}
            onValueChange={(v) => {
              const mode = v as "driving" | "transit";
              setTravelMode(mode);
              emit({ travelMode: mode });
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driving">
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4" /> Driving
                </span>
              </SelectItem>
              <SelectItem value="transit">
                <span className="flex items-center gap-2">
                  <Train className="h-4 w-4" /> Public Transit
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Solve Button */}
      <div className="mt-6 pt-5 border-t border-border/40">
        <Button
          onClick={onSolve}
          disabled={!canSolve || !isConfigured || isSolving}
          className="w-full h-11 text-sm font-medium shadow-sm"
        >
          {isSolving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding best routes...
            </>
          ) : (
            "Plan My Trip"
          )}
        </Button>

        {!isConfigured && !isSolving && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Set your start and end locations to continue
          </p>
        )}
        {isConfigured && !canSolve && !isSolving && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Add at least one activity from the Friends panel
          </p>
        )}
      </div>
    </div>
  );
}
