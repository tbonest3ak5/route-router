"use client";

import { X } from "lucide-react";

import { formatDuration } from "@/lib/time-utils";
import { Activity } from "@/types";

interface Props {
  activity: Activity;
  onRemove: (id: string) => void;
}

export function ActivityChip({ activity, onRemove }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-xs bg-background border rounded-md px-2 py-1 group">
      <span className="font-medium truncate max-w-[120px]">{activity.name}</span>
      <span className="text-muted-foreground shrink-0">
        {formatDuration(activity.minDurationMinutes)}
      </span>
      {activity.required && (
        <span
          className="text-amber-600 font-bold shrink-0"
          title="Non-negotiable"
        >
          ★
        </span>
      )}
      <button
        onClick={() => onRemove(activity.id)}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label="Remove activity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
