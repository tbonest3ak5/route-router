"use client";

import { useCallback, useEffect, useState } from "react";

import { assignColor } from "@/lib/colors";
import {
  getActivities,
  getFriends,
  saveActivities,
  saveFriends,
} from "@/lib/storage";
import { Activity, Friend } from "@/types";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setFriends(getFriends());
    setActivities(getActivities());
  }, []);

  const addFriend = useCallback(
    (name: string): Friend => {
      const friend: Friend = {
        id: crypto.randomUUID(),
        name,
        color: assignColor(friends.length),
      };
      const next = [...friends, friend];
      setFriends(next);
      saveFriends(next);
      return friend;
    },
    [friends]
  );

  const removeFriend = useCallback(
    (id: string) => {
      const nextFriends = friends.filter((f) => f.id !== id);
      const nextActivities = activities.filter((a) => a.friendId !== id);
      setFriends(nextFriends);
      setActivities(nextActivities);
      saveFriends(nextFriends);
      saveActivities(nextActivities);
    },
    [friends, activities]
  );

  const addActivity = useCallback(
    (activity: Omit<Activity, "id">): Activity => {
      const newActivity: Activity = { ...activity, id: crypto.randomUUID() };
      const next = [...activities, newActivity];
      setActivities(next);
      saveActivities(next);
      return newActivity;
    },
    [activities]
  );

  const updateActivity = useCallback(
    (id: string, updates: Partial<Activity>) => {
      const next = activities.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      setActivities(next);
      saveActivities(next);
    },
    [activities]
  );

  const removeActivity = useCallback(
    (id: string) => {
      const next = activities.filter((a) => a.id !== id);
      setActivities(next);
      saveActivities(next);
    },
    [activities]
  );

  return {
    friends,
    activities,
    addFriend,
    removeFriend,
    addActivity,
    updateActivity,
    removeActivity,
  };
}
