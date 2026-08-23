from __future__ import annotations

from fastapi import APIRouter

from .graph_service import GraphService
from .models import Algorithm, CloseRoadRequest, CompareResponse, GraphStats, RouteRequest, RouteResponse
from .routing_service import RoutingService

router = APIRouter()
graph_service = GraphService()
routing_service = RoutingService(graph_service)


@router.get("/graph/stats", response_model=GraphStats)
def graph_stats() -> dict[str, object]:
    return graph_service.stats()


@router.post("/route", response_model=RouteResponse)
def calculate_route(request: RouteRequest) -> dict[str, object]:
    return routing_service.route(request)


@router.post("/route/compare", response_model=CompareResponse)
def compare_algorithms(request: RouteRequest) -> dict[str, object]:
    dijkstra_request = request.model_copy(update={"algorithm": Algorithm.dijkstra})
    astar_request = request.model_copy(update={"algorithm": Algorithm.astar})
    return {
        "dijkstra": routing_service.route(dijkstra_request),
        "astar": routing_service.route(astar_request),
    }


@router.post("/roads/close", response_model=GraphStats)
def close_road(request: CloseRoadRequest) -> dict[str, object]:
    graph_service.close_road(request.road_id)
    return graph_service.stats()


@router.post("/roads/open", response_model=GraphStats)
def open_road(request: CloseRoadRequest) -> dict[str, object]:
    graph_service.open_road(request.road_id)
    return graph_service.stats()


@router.post("/roads/reset", response_model=GraphStats)
def reset_road_closures() -> dict[str, object]:
    graph_service.reset_closures()
    return graph_service.stats()
