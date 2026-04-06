"use client";

import { useState } from "react";
import { X, Save, RotateCcw } from "lucide-react";

import { formatDuration } from "@/lib/time-utils";
import { Activity } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  activity: Activity;
  onRemove: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Activity>) => void;
}

export function ActivityChip({ activity, onRemove, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activity.name);
  const [editHours, setEditHours] = useState(
    Math.floor(activity.minDurationMinutes / 60).toString()
  );
  const [editMinutes, setEditMinutes] = useState(
    (activity.minDurationMinutes % 60).toString()
  );

  const handleSave = () => {
    if (!editName.trim()) return;
    const h = parseInt(editHours, 10) || 0;
    const m = parseInt(editMinutes, 10) || 0;
    const totalMinutes = h * 60 + m;
    if (totalMinutes <= 0) return;

    onUpdate?.(activity.id, {
      name: editName.trim(),
      minDurationMinutes: totalMinutes,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(activity.name);
    setEditHours(Math.floor(activity.minDurationMinutes / 60).toString());
    setEditMinutes((activity.minDurationMinutes % 60).toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 text-xs bg-card border border-border/60 rounded-lg px-3 py-2 flex-wrap">
        <Input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Activity name"
          className="h-6 text-xs flex-1 min-w-[100px]"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            value={editHours}
            onChange={(e) => setEditHours(e.target.value)}
            className="h-6 w-10 text-xs text-center"
            placeholder="0"
          />
          <span className="text-muted-foreground">h</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={editMinutes}
            onChange={(e) => setEditMinutes(e.target.value)}
            className="h-6 w-10 text-xs text-center"
            placeholder="0"
          />
          <span className="text-muted-foreground">m</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-6 px-2"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-6 px-2"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 text-xs bg-card border border-border/60 rounded-lg px-3 py-2 group shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-muted/40"
    >
      <span className="font-medium truncate max-w-[140px] text-foreground">{activity.name}</span>
      <span className="text-muted-foreground shrink-0 bg-muted/50 px-1.5 py-0.5 rounded">
        {formatDuration(activity.minDurationMinutes)}
      </span>
      {activity.required && (
        <span
          className="text-amber-500 font-bold shrink-0"
          title="Non-negotiable"
        >
          ★
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(activity.id);
        }}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10"
        aria-label="Remove activity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
