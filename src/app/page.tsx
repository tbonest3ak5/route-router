"use client";

import { useState } from "react";

import { FriendList } from "@/components/friends/FriendList";
import { TripMap } from "@/components/map/TripMap";
import { RouteResultsPanel } from "@/components/trip/RouteResultsPanel";
import { TripConfigPanel } from "@/components/trip/TripConfigPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useFriends } from "@/hooks/useFriends";
import { useSolver } from "@/hooks/useSolver";
import { useTripConfig } from "@/hooks/useTripConfig";
import { DirectionsLegDetails } from "@/types";
import { MapPin, Route, Users } from "lucide-react";

export default function Home() {
  const { friends, activities, addFriend, removeFriend, addActivity, removeActivity } =
    useFriends();
  const { tripConfig, updateTripConfig } = useTripConfig();
  const { solve, response, isLoading, error, selectedRouteIndex, setSelectedRouteIndex } =
    useSolver();
  const [directionsLegs, setDirectionsLegs] = useState<DirectionsLegDetails[] | null>(null);

  const selectedRoute = response?.routes[selectedRouteIndex] ?? null;

  // Combine trip date + start time into a Date for transit scheduling
  const tripStartDate =
    tripConfig
      ? (() => {
          const [h, m] = tripConfig.startTime.split(":").map(Number);
          const d = new Date(tripConfig.date + "T00:00:00");
          d.setHours(h, m, 0, 0);
          return d;
        })()
      : undefined;

  const handleSolve = () => {
    if (!tripConfig || activities.length === 0) return;
    setDirectionsLegs(null);
    solve(activities, tripConfig);
  };

  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
    setDirectionsLegs(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b bg-background px-5 py-2.5 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-sm tracking-tight">Day Trip Planner</h1>
        </div>
        {activities.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>{activities.length} {activities.length === 1 ? "activity" : "activities"}</span>
            {activities.filter((a) => a.required).length > 0 && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-amber-600 font-medium">
                  {activities.filter((a) => a.required).length} non-negotiable
                </span>
              </>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel with tabs ── */}
        <aside className="w-[380px] shrink-0 border-r flex flex-col overflow-hidden bg-background">
          <Tabs defaultValue="friends" className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b shrink-0 h-10 bg-muted/40 justify-start px-3 gap-1">
              <TabsTrigger
                value="friends"
                className="flex items-center gap-1.5 text-xs h-7 px-3"
              >
                <Users className="h-3 w-3" />
                Friends
                {activities.length > 0 && (
                  <span className="bg-primary/15 text-primary rounded-full px-1.5 py-0 text-[10px] font-semibold ml-0.5">
                    {activities.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="flex items-center gap-1.5 text-xs h-7 px-3"
              >
                <Route className="h-3 w-3" />
                Plan
                {response && (
                  <span className="bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0 text-[10px] font-semibold ml-0.5">
                    {response.routes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Friends tab */}
            <TabsContent value="friends" className="flex-1 overflow-y-auto mt-0 border-0 p-0">
              <FriendList
                friends={friends}
                activities={activities}
                onAddFriend={addFriend}
                onRemoveFriend={removeFriend}
                onAddActivity={addActivity}
                onRemoveActivity={removeActivity}
              />
            </TabsContent>

            {/* Plan tab */}
            <TabsContent value="plan" className="flex-1 overflow-y-auto mt-0 border-0 p-0">
              <TripConfigPanel
                tripConfig={tripConfig}
                onConfigChange={updateTripConfig}
                onSolve={handleSolve}
                isSolving={isLoading}
                canSolve={activities.length > 0}
              />

              {error && (
                <div className="mx-4 mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {response && (
                <>
                  <Separator />
                  <RouteResultsPanel
                    response={response}
                    activities={activities}
                    friends={friends}
                    selectedRouteIndex={selectedRouteIndex}
                    onSelectRoute={handleRouteSelect}
                    directionsLegs={directionsLegs}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </aside>

        {/* ── Map (full height) ── */}
        <main className="flex-1 relative overflow-hidden">
          <TripMap
            activities={activities}
            friends={friends}
            selectedRoute={selectedRoute}
            travelMode={tripConfig?.travelMode ?? "driving"}
            startLatLng={tripConfig?.startLatLng}
            endLatLng={tripConfig?.endLatLng}
            tripStartDate={tripStartDate}
            onDirectionsLegs={setDirectionsLegs}
          />
        </main>

      </div>
    </div>
  );
}
