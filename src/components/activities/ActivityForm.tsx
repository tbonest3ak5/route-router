"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, LatLng, PlacePrediction } from "@/types";

import { PlacesCombobox } from "./PlacesCombobox";

interface Props {
  friendId: string;
  onSubmit: (activity: Omit<Activity, "id">) => void;
  onCancel: () => void;
}

export function ActivityForm({ friendId, onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latlng, setLatlng] = useState<LatLng | null>(null);
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [required, setRequired] = useState(false);

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    setAddress(prediction.description);
    setLatlng(prediction.latlng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !latlng) return;

    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const totalMinutes = h * 60 + m;
    if (totalMinutes <= 0) return;

    onSubmit({
      friendId,
      name: name.trim() || address.split(",")[0],
      address,
      latlng,
      minDurationMinutes: totalMinutes,
      required,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/40">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Activity name (optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. MoMA, Central Park..."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Location *</Label>
        <PlacesCombobox
          value={address}
          onSelect={handlePlaceSelect}
          placeholder="Search for a place..."
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Minimum duration *</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min="0"
            max="12"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">h</span>
          <Input
            type="number"
            min="0"
            max="59"
            step="15"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      </div>

      <div className="flex items-center gap-3 py-1">
        <Switch
          id={`required-${friendId}`}
          checked={required}
          onCheckedChange={setRequired}
        />
        <Label htmlFor={`required-${friendId}`} className="text-xs cursor-pointer text-foreground">
          Non-negotiable (must visit)
        </Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" disabled={!latlng} className="h-9 text-xs px-4">
          Add Activity
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-9 text-xs"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
