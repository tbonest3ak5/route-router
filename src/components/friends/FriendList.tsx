"use client";

import { Users } from "lucide-react";

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
}

export function FriendList({
  friends,
  activities,
  onAddFriend,
  onRemoveFriend,
  onAddActivity,
  onRemoveActivity,
}: Props) {
  return (
    <div className="px-4 py-4">
      <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        Friends & Activities
      </h2>

      {friends.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center mb-2">
          <p className="text-sm text-muted-foreground">No friends added yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add friends and their preferred activities below
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              activities={activities.filter((a) => a.friendId === friend.id)}
              onAddActivity={onAddActivity}
              onRemoveActivity={onRemoveActivity}
              onRemoveFriend={onRemoveFriend}
            />
          ))}
        </div>
      )}

      <AddFriendDialog onAdd={onAddFriend} />
    </div>
  );
}
