export type TravelMode = "driving" | "transit";

export interface LatLng {
  lat: number;
  lng: number;
}

// ── Domain models (stored in localStorage) ────────────────────────────────────

export interface Friend {
  id: string;
  name: string;
  color: string; // hex color
}

export interface Activity {
  id: string;
  friendId: string;
  name: string;
  address: string;
  latlng: LatLng;
  minDurationMinutes: number;
  required: boolean;
}

export interface TripConfig {
  startAddress: string;
  startLatLng: LatLng;
  startTime: string; // "HH:MM"
  endAddress: string;
  endLatLng: LatLng;
  endTime: string; // "HH:MM"
  travelMode: TravelMode;
  date: string; // "YYYY-MM-DD"
}

// ── Solver API contract ────────────────────────────────────────────────────────

export interface SolverActivity {
  id: string;
  name: string;
  latlng: LatLng;
  minDurationMinutes: number;
  required: boolean;
  friendId: string;
}

export interface TravelMatrix {
  nodeIds: string[]; // ["depot_start", "depot_end", activityId, ...]
  durationSeconds: number[][];
}

export interface SolverRequest {
  tripConfig: {
    startLatLng: LatLng;
    endLatLng: LatLng;
    startTimeMinutes: number;
    endTimeMinutes: number;
    travelMode: TravelMode;
  };
  activities: SolverActivity[];
  travelMatrix: TravelMatrix;
}

export interface ScheduledStop {
  activityId: string;
  arrivalMinutes: number;
  departureMinutes: number;
  travelTimeFromPreviousSeconds: number;
}

export type RouteVariant = "shortest_time" | "most_activities" | "balanced";

export interface SolverRoute {
  variant: RouteVariant;
  stops: ScheduledStop[];
  totalDurationMinutes: number;
  includedActivityIds: string[];
  excludedActivityIds: string[];
  score: number;
  startDepartureMinutes?: number;  // departure time from start location
  endArrivalMinutes?: number;      // arrival time at end location
}

export interface SolverResponse {
  routes: SolverRoute[];
  solveTimeMs: number;
}

// ── Places Autocomplete ────────────────────────────────────────────────────────

export interface PlacePrediction {
  description: string;
  placeId: string;
  latlng: LatLng;
}

// ── Transit / Directions step details ─────────────────────────────────────────

export interface TransitStepDetails {
  mode: "WALKING" | "TRANSIT";
  durationText: string;
  distanceText?: string;
  instructions?: string;
  // Transit-specific
  lineName?: string;      // "King", "Line 1 Yonge–University"
  lineShortName?: string; // "504", "1"
  lineColor?: string;     // "#FF0000" (from transit agency, includes #)
  lineTextColor?: string;
  vehicleType?: string;   // "BUS" | "SUBWAY" | "TRAM" | "HEAVY_RAIL" | "FERRY"
  vehicleName?: string;   // "Bus" | "Subway" | "Streetcar"
  departureStop?: string;
  arrivalStop?: string;
  departureTimeText?: string;
  arrivalTimeText?: string;
  numStops?: number;
  headsign?: string;
}

export interface DirectionsLegDetails {
  steps: TransitStepDetails[];
  durationText?: string;
}
