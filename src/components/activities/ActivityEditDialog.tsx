"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, PlacePrediction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlacesCombobox } from "./PlacesCombobox";

interface Props {
  open: boolean;
  activity: Activity;
  onSave: (updates: Partial<Activity>) => void;
  onCancel: () => void;
}

export function ActivityEditDialog({ open, activity, onSave, onCancel }: Props) {
  const [name, setName] = useState(activity.name);
  const [address, setAddress] = useState(activity.address);
  const [hours, setHours] = useState(
    Math.floor(activity.minDurationMinutes / 60).toString()
  );
  const [minutes, setMinutes] = useState(
    (activity.minDurationMinutes % 60).toString()
  );
  const [required, setRequired] = useState(activity.required);

  // Sync with activity when it changes
  useEffect(() => {
    if (open) {
      setName(activity.name);
      setAddress(activity.address);
      setHours(Math.floor(activity.minDurationMinutes / 60).toString());
      setMinutes((activity.minDurationMinutes % 60).toString());
      setRequired(activity.required);
    }
  }, [open, activity]);

  const handlePlaceSelect = (prediction: PlacePrediction) => {
    setAddress(prediction.description);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const totalMinutes = h * 60 + m;
    if (totalMinutes <= 0) return;

    onSave({
      name: name.trim() || address.split(",")[0],
      address,
      latlng: activity.latlng, // Keep the same location
      minDurationMinutes: totalMinutes,
      required,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {/* Map preview */}
        <div className="w-full h-36 bg-muted overflow-hidden relative">
          <img
            src={`/api/place-photo?lat=${activity.latlng.lat}&lng=${activity.latlng.lng}&name=${encodeURIComponent(activity.name)}`}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 pt-4">
        <DialogHeader>
          <DialogTitle className="text-lg">{activity.name || "Edit Activity"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Activity name (optional)
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MoMA, Central Park..."
              className="h-10"
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
            <Label className="text-xs text-muted-foreground">
              Minimum duration *
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                max="12"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-20 h-10"
              />
              <span className="text-xs text-muted-foreground">h</span>
              <Input
                type="number"
                min="0"
                max="59"
                step="15"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-20 h-10"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <Switch
              id={`required-edit-${activity.id}`}
              checked={required}
              onCheckedChange={setRequired}
            />
            <Label
              htmlFor={`required-edit-${activity.id}`}
              className="text-xs text-muted-foreground"
            >
              Non-negotiable (must include)
            </Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!address}
              className="h-10"
            >
              Save Changes
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
