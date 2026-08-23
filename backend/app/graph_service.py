from __future__ import annotations

import csv
from pathlib import Path


class GraphService:
    def __init__(self, data_dir: Path | None = None) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        self.data_dir = data_dir or repo_root / "data" / "processed"
        self.closed_road_ids: set[int] = set()

    @property
    def nodes_path(self) -> Path:
        return self.data_dir / "nodes.csv"

    @property
    def edges_path(self) -> Path:
        return self.data_dir / "edges.csv"

    def stats(self) -> dict[str, object]:
        return {
            "nodeCount": self._count_csv_rows(self.nodes_path),
            "edgeCount": self._count_csv_rows(self.edges_path),
            "closedRoadIds": sorted(self.closed_road_ids),
        }

    def close_road(self, road_id: int) -> None:
        self.closed_road_ids.add(road_id)

    def open_road(self, road_id: int) -> None:
        self.closed_road_ids.discard(road_id)

    def reset_closures(self) -> None:
        self.closed_road_ids.clear()

    @staticmethod
    def _count_csv_rows(path: Path) -> int:
        if not path.exists():
            return 0

        with path.open(newline="") as file:
            reader = csv.reader(file)
            next(reader, None)
            return sum(1 for _row in reader)
