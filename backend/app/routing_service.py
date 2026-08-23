from __future__ import annotations

import json
import subprocess
from pathlib import Path

from fastapi import HTTPException

from .graph_service import GraphService
from .models import RouteRequest


class RoutingService:
    def __init__(self, graph_service: GraphService) -> None:
        self.graph_service = graph_service
        repo_root = Path(__file__).resolve().parents[2]
        self.executable = repo_root / "routing-engine" / "build" / "routex_cli"

    def route(self, request: RouteRequest) -> dict[str, object]:
        if not self.executable.exists():
            raise HTTPException(
                status_code=503,
                detail=(
                    "C++ routing engine is not built. Run CMake in routing-engine/ "
                    "to create build/routex_cli before starting the API."
                ),
            )

        args = [
            str(self.executable),
            "--nodes",
            str(self.graph_service.nodes_path),
            "--edges",
            str(self.graph_service.edges_path),
            "--start-lat",
            str(request.start.latitude),
            "--start-lon",
            str(request.start.longitude),
            "--destination-lat",
            str(request.destination.latitude),
            "--destination-lon",
            str(request.destination.longitude),
            "--algorithm",
            request.algorithm.value,
            "--closed-roads",
            ",".join(str(road_id) for road_id in sorted(self.graph_service.closed_road_ids)) or "none",
        ]

        completed = subprocess.run(args, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=completed.stderr.strip() or "routing engine failed",
            )

        return json.loads(completed.stdout)
