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
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface Props {
  friend: Friend;
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onRemoveActivity: (id: string) => void;
  onRemoveFriend: (id: string) => void;
}

export function FriendCard({
  friend,
  activities,
  onAddActivity,
  onRemoveActivity,
  onRemoveFriend,
}: Props) {
  const [open, setOpen] = useState(true);
  const [addingActivity, setAddingActivity] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Header row — trigger and remove button are SIBLINGS, not nested */}
        <div className="flex items-center">
          <CollapsibleTrigger className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 cursor-pointer hover:bg-muted/50 select-none text-left">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: friend.color }}
            />
            <span className="font-medium text-sm flex-1 truncate">{friend.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
          </CollapsibleTrigger>

          {/* Remove button lives OUTSIDE the trigger to avoid button-in-button */}
          <div className="border-l px-2 py-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onRemoveFriend(friend.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${friend.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-2 border-t">
            {activities.length > 0 && (
              <div className="space-y-1.5 mt-1">
                {activities.map((a) => (
                  <ActivityChip
                    key={a.id}
                    activity={a}
                    onRemove={onRemoveActivity}
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
                className="w-full h-7 text-xs border border-dashed"
                onClick={() => setAddingActivity(true)}
              >
                + Add Activity
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
