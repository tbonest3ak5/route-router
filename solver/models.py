from pydantic import BaseModel
from typing import Literal


class LatLng(BaseModel):
    lat: float
    lng: float


class SolverActivity(BaseModel):
    id: str
    name: str
    latlng: LatLng
    minDurationMinutes: int
    required: bool
    friendId: str


class TravelMatrix(BaseModel):
    nodeIds: list[str]
    durationSeconds: list[list[int]]


class TripConfigInput(BaseModel):
    startLatLng: LatLng
    endLatLng: LatLng
    startTimeMinutes: int
    endTimeMinutes: int
    travelMode: Literal["driving", "transit"]


class SolverRequest(BaseModel):
    tripConfig: TripConfigInput
    activities: list[SolverActivity]
    travelMatrix: TravelMatrix


class ScheduledStop(BaseModel):
    activityId: str
    arrivalMinutes: int
    departureMinutes: int
    travelTimeFromPreviousSeconds: int


class SolverRoute(BaseModel):
    variant: Literal["optimal"]
    stops: list[ScheduledStop]
    totalDurationMinutes: int
    includedActivityIds: list[str]
    excludedActivityIds: list[str]
    score: int


class SolverResponse(BaseModel):
    routes: list[SolverRoute]
    solveTimeMs: int
