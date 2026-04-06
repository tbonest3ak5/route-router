import { Activity, Friend, TripConfig } from "@/types";

const KEYS = {
  friends: "rp:friends",
  activities: "rp:activities",
  tripConfig: "rp:tripConfig",
} as const;

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFriends(): Friend[] {
  return get<Friend[]>(KEYS.friends) ?? [];
}

export function saveFriends(friends: Friend[]): void {
  set(KEYS.friends, friends);
}

export function getActivities(): Activity[] {
  return get<Activity[]>(KEYS.activities) ?? [];
}

export function saveActivities(activities: Activity[]): void {
  set(KEYS.activities, activities);
}

export function getTripConfig(): TripConfig | null {
  return get<TripConfig>(KEYS.tripConfig);
}

export function saveTripConfig(config: TripConfig): void {
  set(KEYS.tripConfig, config);
}
