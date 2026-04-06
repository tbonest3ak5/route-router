"""
OR-Tools VRP solver for day trip route planning.

Node layout in the distance matrix:
  0 = depot_start
  1 = depot_end
  2..N+1 = activities (in the order provided)
"""

import time
from typing import Literal

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from models import (
    ScheduledStop,
    SolverActivity,
    SolverRequest,
    SolverResponse,
    SolverRoute,
)


class SolverInfeasibleError(Exception):
    pass


# Each variant penalises dropping optional activities differently,
# producing meaningfully different route characters.
VARIANT_CONFIGS: list[dict] = [
    {
        "name": "shortest_time",
        "drop_penalty": 500_000,   # drops optionals if travel cost is high
        "time_limit_s": 5,
    },
    {
        "name": "most_activities",
        "drop_penalty": 100_000_000,  # almost never drops optionals
        "time_limit_s": 5,
    },
    {
        "name": "balanced",
        "drop_penalty": 2_000_000,
        "time_limit_s": 5,
    },
]


def solve(request: SolverRequest) -> SolverResponse:
    start = time.monotonic()

    if not request.activities:
        raise ValueError("At least one activity is required")

    routes: list[SolverRoute] = []
    seen_orderings: set[tuple[str, ...]] = set()

    for config in VARIANT_CONFIGS:
        route = _solve_variant(request, config)
        if route is None:
            continue
        ordering = tuple(s.activityId for s in route.stops)
        if ordering in seen_orderings:
            continue
        seen_orderings.add(ordering)
        routes.append(route)

    if not routes:
        raise SolverInfeasibleError(
            "Required activities cannot all fit within the time window"
        )

    elapsed_ms = int((time.monotonic() - start) * 1000)
    return SolverResponse(routes=routes, solveTimeMs=elapsed_ms)


def _solve_variant(
    request: SolverRequest,
    config: dict,
) -> SolverRoute | None:
    activities = request.activities
    tc = request.tripConfig
    matrix = request.travelMatrix.durationSeconds
    n_activities = len(activities)

    # OR-Tools requires a symmetric-enough matrix; depot_start=0, depot_end=1
    manager = pywrapcp.RoutingIndexManager(
        n_activities + 2,  # num nodes
        1,                 # num vehicles
        [0],               # start nodes
        [1],               # end nodes
    )
    routing = pywrapcp.RoutingModel(manager)

    # ── Transit / time callback ──────────────────────────────────────────────
    def time_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        travel = matrix[from_node][to_node]
        # Add service time at the FROM node (depots have 0 service time)
        if from_node >= 2:
            service = activities[from_node - 2].minDurationMinutes * 60
        else:
            service = 0
        return travel + service

    transit_cb_idx = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb_idx)

    # ── Time dimension ───────────────────────────────────────────────────────
    horizon = tc.endTimeMinutes * 60  # seconds from midnight (upper bound)
    routing.AddDimension(
        transit_cb_idx,
        slack_max=0,
        capacity=horizon,
        fix_start_cumul_to_zero=False,
        name="Time",
    )
    time_dim = routing.GetDimensionOrDie("Time")

    # Fix the departure time at depot_start
    start_idx = routing.Start(0)
    time_dim.CumulVar(start_idx).SetRange(
        tc.startTimeMinutes * 60, tc.startTimeMinutes * 60
    )

    # Must arrive at depot_end before endTime
    end_idx = routing.End(0)
    time_dim.CumulVar(end_idx).SetRange(0, tc.endTimeMinutes * 60)

    # Each activity node: open window from start to latest-possible arrival
    for i, act in enumerate(activities):
        node_idx = manager.NodeToIndex(i + 2)
        latest = tc.endTimeMinutes * 60 - act.minDurationMinutes * 60
        if latest < tc.startTimeMinutes * 60:
            # This activity alone can't fit in the window
            if act.required:
                return None  # infeasible
            routing.AddDisjunction([node_idx], config["drop_penalty"])
            continue
        time_dim.CumulVar(node_idx).SetRange(
            tc.startTimeMinutes * 60, latest
        )
        if not act.required:
            routing.AddDisjunction([node_idx], config["drop_penalty"])

    # ── Search parameters ────────────────────────────────────────────────────
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = config["time_limit_s"]
    search_params.log_search = False

    solution = routing.SolveWithParameters(search_params)

    if solution is None:
        return None
    if routing.status() not in (1, 2):  # ROUTING_SUCCESS or ROUTING_OPTIMAL
        return None

    return _extract_route(
        routing, manager, solution, activities, tc.startTimeMinutes,
        config["name"],  # type: ignore[arg-type]
    )


def _extract_route(
    routing: pywrapcp.RoutingModel,
    manager: pywrapcp.RoutingIndexManager,
    solution: pywrapcp.Assignment,
    activities: list[SolverActivity],
    start_time_minutes: int,
    variant: Literal["shortest_time", "most_activities", "balanced"],
) -> SolverRoute:
    time_dim = routing.GetDimensionOrDie("Time")
    stops: list[ScheduledStop] = []
    prev_departure_s = start_time_minutes * 60

    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        if node >= 2:
            act = activities[node - 2]
            arrival_s = solution.Min(time_dim.CumulVar(index))
            duration_s = act.minDurationMinutes * 60
            departure_s = arrival_s + duration_s
            travel_s = arrival_s - prev_departure_s
            stops.append(
                ScheduledStop(
                    activityId=act.id,
                    arrivalMinutes=arrival_s // 60,
                    departureMinutes=departure_s // 60,
                    travelTimeFromPreviousSeconds=max(0, travel_s),
                )
            )
            prev_departure_s = departure_s
        index = solution.Value(routing.NextVar(index))

    included = [s.activityId for s in stops]
    excluded = [
        a.id for a in activities if a.id not in included and not a.required
    ]

    # Total duration: from start time to last departure
    if stops:
        last_dep = stops[-1].departureMinutes
        total = last_dep - start_time_minutes
    else:
        total = 0

    return SolverRoute(
        variant=variant,
        stops=stops,
        totalDurationMinutes=total,
        includedActivityIds=included,
        excludedActivityIds=excluded,
        score=int(solution.ObjectiveValue()),
    )
