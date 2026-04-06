"use client";

import { UserPlus } from "lucide-react";

import { AddFriendDialog } from "./AddFriendDialog";
import { FriendCard } from "./FriendCard";
import { Activity, Friend } from "@/types";

interface Props {
  friends: Friend[];
  activities: Activity[];
  onAddFriend: (name: string) => void;
  onRemoveFriend: (id: string) => void;
  onAddActivity: (activity: Omit<Activity, "id">) => void;
  onRemoveActivity: (id: string) => void;
  onUpdateActivity?: (id: string, updates: Partial<Activity>) => void;
}

export function FriendList({
  friends,
  activities,
  onAddFriend,
  onRemoveFriend,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
}: Props) {
  return (
    <div className="p-5">
      {friends.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No friends added yet</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Add friends and their preferred activities to start planning your trip
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              activities={activities.filter((a) => a.friendId === friend.id)}
              onAddActivity={onAddActivity}
              onRemoveActivity={onRemoveActivity}
              onUpdateActivity={onUpdateActivity}
              onRemoveFriend={onRemoveFriend}
            />
          ))}
        </div>
      )}

      <AddFriendDialog onAdd={onAddFriend} />
    </div>
  );
}
