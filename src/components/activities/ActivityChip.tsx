"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { formatDuration } from "@/lib/time-utils";
import { Activity } from "@/types";
import { Button } from "@/components/ui/button";
import { ActivityEditDialog } from "./ActivityEditDialog";

interface Props {
  activity: Activity;
  onRemove: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Activity>) => void;
}

export function ActivityChip({ activity, onRemove, onUpdate }: Props) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleUpdate = (updates: Partial<Activity>) => {
    onUpdate?.(activity.id, updates);
    setEditDialogOpen(false);
  };

  return (
    <>
      <div
        onClick={() => setEditDialogOpen(true)}
        className="flex items-center gap-2 text-xs bg-card border border-border/60 rounded-lg px-3 py-2 group shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-muted/40"
      >
        <span className="font-medium truncate max-w-[140px] text-foreground">
          {activity.name}
        </span>
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

      <ActivityEditDialog
        open={editDialogOpen}
        activity={activity}
        onSave={handleUpdate}
        onCancel={() => setEditDialogOpen(false)}
      />
    </>
  );
}
