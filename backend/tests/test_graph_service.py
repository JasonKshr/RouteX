from pathlib import Path

from backend.app.graph_service import GraphService


def test_graph_stats_reads_processed_dataset() -> None:
    service = GraphService(Path("data/processed"))
    stats = service.stats()

    assert stats["nodeCount"] >= 10
    assert stats["edgeCount"] >= 10


def test_road_closures_are_temporary() -> None:
    service = GraphService(Path("data/processed"))
    service.close_road(5003)
    assert service.stats()["closedRoadIds"] == [5003]

    service.open_road(5003)
    assert service.stats()["closedRoadIds"] == []
