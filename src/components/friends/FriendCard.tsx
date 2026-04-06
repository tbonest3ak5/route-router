"use client";

import { useState } from "react";

import { ActivityChip } from "@/components/activities/ActivityChip";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Activity, Friend } from "@/types";
import { ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react";

interface Props {
  friend: Friend;
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onRemoveActivity: (id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
  onRemoveFriend: (id: string) => void;
}

export function FriendCard({
  friend,
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
  onRemoveFriend,
}: Props) {
  const [open, setOpen] = useState(true);
  const [addingActivity, setAddingActivity] = useState(false);

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Header row */}
        <div className="flex items-center">
          <CollapsibleTrigger className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0 cursor-pointer hover:bg-muted/40 transition-colors select-none text-left">
            <div
              className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
              style={{ backgroundColor: friend.color, boxShadow: `0 0 8px ${friend.color}40` }}
            />
            <span className="font-medium text-sm flex-1 truncate text-foreground">{friend.name}</span>
            <span className="text-xs text-muted-foreground shrink-0 bg-muted/50 px-2 py-0.5 rounded-full">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </CollapsibleTrigger>

          {/* Remove button - outside trigger */}
          <div className="border-l border-border/40 px-3 py-3.5 shrink-0">
            <button
              type="button"
              onClick={() => onRemoveFriend(friend.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              aria-label={`Remove ${friend.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40">
            {activities.length > 0 && (
              <div className="space-y-2 mt-2">
                {activities.map((a) => (
                  <ActivityChip
                    key={a.id}
                    activity={a}
                    onRemove={onRemoveActivity}
                    onUpdate={onUpdateActivity}
                  />
                ))}
              </div>
            )}

            {addingActivity ? (
              <ActivityForm
                friendId={friend.id}
                onSubmit={(activity) => {
                  onAddActivity(activity);
                  setAddingActivity(false);
                }}
                onCancel={() => setAddingActivity(false)}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-xs border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                onClick={() => setAddingActivity(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Activity
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
