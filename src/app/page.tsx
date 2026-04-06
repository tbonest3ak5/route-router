"use client";

import { useCallback, useMemo, useState } from "react";

import { FriendList } from "@/components/friends/FriendList";
import { TripMap } from "@/components/map/TripMap";
import { RouteResultsPanel } from "@/components/trip/RouteResultsPanel";
import { TripConfigPanel } from "@/components/trip/TripConfigPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFriends } from "@/hooks/useFriends";
import { useSolver } from "@/hooks/useSolver";
import { useTripConfig } from "@/hooks/useTripConfig";
import { DirectionsLegDetails } from "@/types";
import { Compass } from "lucide-react";

export default function Home() {
  const { friends, activities, addFriend, removeFriend, addActivity, removeActivity } =
    useFriends();
  const { tripConfig, updateTripConfig } = useTripConfig();
  const { solve, response, isLoading, error, selectedRouteIndex, setSelectedRouteIndex } =
    useSolver();
  const [directionsLegs, setDirectionsLegs] = useState<DirectionsLegDetails[] | null>(null);

  const selectedRoute = response?.routes[selectedRouteIndex] ?? null;

  // Combine trip date + start time into a Date for transit scheduling
  const tripStartDate = useMemo(() => {
    if (!tripConfig) return undefined;
    const [h, m] = tripConfig.startTime.split(":").map(Number);
    const d = new Date(tripConfig.date + "T00:00:00");
    d.setHours(h, m, 0, 0);
    return d;
  }, [tripConfig?.date, tripConfig?.startTime]);

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
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-xl p-2 shadow-sm">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-foreground">Route Router</h1>
            <p className="text-xs text-muted-foreground">Plan your perfect day trip</p>
          </div>
        </div>
        {activities.length > 0 && (
          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground">{friends.length}</span>
              <span className="text-foreground font-medium">{friends.length === 1 ? "friend" : "friends"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
              <span className="text-muted-foreground">{activities.length}</span>
              <span className="text-foreground font-medium">{activities.length === 1 ? "activity" : "activities"}</span>
            </div>
            {activities.filter((a) => a.required).length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100/50 border border-amber-200/50">
                <span className="text-amber-700 font-medium">
                  {activities.filter((a) => a.required).length} must-do
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Body - Two columns: Left panels + Map */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left side - Friends + Trip Config side by side */}
        <aside className="w-[780px] shrink-0 border-r border-border/60 flex overflow-hidden bg-card/30">
          
          {/* Friends panel */}
          <div className="w-[320px] shrink-0 flex flex-col border-r border-border/40 min-h-0">
            <div className="px-4 py-3 border-b border-border/40 shrink-0">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Friends & Activities
              </h2>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <FriendList
                friends={friends}
                activities={activities}
                onAddFriend={addFriend}
                onRemoveFriend={removeFriend}
                onAddActivity={addActivity}
                onRemoveActivity={removeActivity}
              />
            </ScrollArea>
          </div>

          {/* Trip Config + Results panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
            <div className="px-4 py-3 border-b border-border/40 shrink-0">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Trip Planning
              </h2>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              <TripConfigPanel
                tripConfig={tripConfig}
                onConfigChange={updateTripConfig}
                onSolve={handleSolve}
                isSolving={isLoading}
                canSolve={activities.length > 0}
              />

              {error && (
                <div className="mx-4 mb-4 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {response && (
                <>
                  <Separator className="mx-4" />
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
            </ScrollArea>
          </div>

        </aside>

        {/* Right side - Map takes remaining space */}
        <main className="flex-1 relative overflow-hidden bg-muted/30">
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
