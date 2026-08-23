from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Algorithm(str, Enum):
    astar = "astar"
    dijkstra = "dijkstra"


class Coordinate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    start: Coordinate
    destination: Coordinate
    algorithm: Algorithm = Algorithm.astar


class CloseRoadRequest(BaseModel):
    road_id: int = Field(alias="roadId")


class RouteResponse(BaseModel):
    route: list[tuple[float, float]]
    explored_nodes: list[tuple[float, float]] = Field(alias="exploredNodes")
    path_node_ids: list[int] = Field(alias="pathNodeIds")
    distance_meters: float = Field(alias="distanceMeters")
    nodes_explored: int = Field(alias="nodesExplored")
    execution_time_ms: float = Field(alias="executionTimeMs")
    algorithm: Literal["astar", "dijkstra"]
    route_found: bool = Field(alias="routeFound")
    start_node: int = Field(alias="startNode")
    destination_node: int = Field(alias="destinationNode")

    model_config = {"populate_by_name": True}


class CompareResponse(BaseModel):
    dijkstra: RouteResponse
    astar: RouteResponse


class GraphStats(BaseModel):
    node_count: int = Field(alias="nodeCount")
    edge_count: int = Field(alias="edgeCount")
    closed_road_ids: list[int] = Field(alias="closedRoadIds")

    model_config = {"populate_by_name": True}
