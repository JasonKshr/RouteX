#!/usr/bin/env python3
"""Convert an OpenStreetMap XML extract into RouteX nodes.csv and edges.csv."""

from __future__ import annotations

import argparse
import csv
import math
import xml.etree.ElementTree as ET
from pathlib import Path


DRIVABLE_HIGHWAYS = {
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "unclassified",
    "residential",
    "living_street",
    "service",
}


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def parse_tags(element: ET.Element) -> dict[str, str]:
    return {
        child.attrib["k"]: child.attrib["v"]
        for child in element.findall("tag")
        if "k" in child.attrib and "v" in child.attrib
    }


def preprocess(osm_path: Path, output_dir: Path) -> None:
    tree = ET.parse(osm_path)
    root = tree.getroot()

    nodes: dict[int, tuple[float, float]] = {}
    for node in root.findall("node"):
        nodes[int(node.attrib["id"])] = (
            float(node.attrib["lat"]),
            float(node.attrib["lon"]),
        )

    edges: list[tuple[int, int, float, int, bool, str]] = []
    used_node_ids: set[int] = set()

    for way in root.findall("way"):
        tags = parse_tags(way)
        highway = tags.get("highway")
        if highway not in DRIVABLE_HIGHWAYS:
            continue

        refs = [int(ref.attrib["ref"]) for ref in way.findall("nd")]
        road_id = int(way.attrib["id"])
        road_name = tags.get("name", f"OSM way {road_id}")
        bidirectional = tags.get("oneway", "").lower() not in {"yes", "true", "1"}

        for source, destination in zip(refs, refs[1:]):
            if source not in nodes or destination not in nodes:
                continue
            lat1, lon1 = nodes[source]
            lat2, lon2 = nodes[destination]
            distance = haversine_meters(lat1, lon1, lat2, lon2)
            edges.append((source, destination, distance, road_id, bidirectional, road_name))
            used_node_ids.update({source, destination})

    output_dir.mkdir(parents=True, exist_ok=True)

    with (output_dir / "nodes.csv").open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["id", "latitude", "longitude"])
        for node_id in sorted(used_node_ids):
            latitude, longitude = nodes[node_id]
            writer.writerow([node_id, f"{latitude:.7f}", f"{longitude:.7f}"])

    with (output_dir / "edges.csv").open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["source", "destination", "distance", "road_id", "bidirectional", "name"])
        for source, destination, distance, road_id, bidirectional, road_name in edges:
            writer.writerow([
                source,
                destination,
                f"{distance:.3f}",
                road_id,
                "true" if bidirectional else "false",
                road_name,
            ])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("osm_path", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("data/processed"))
    args = parser.parse_args()

    preprocess(args.osm_path, args.output_dir)


if __name__ == "__main__":
    main()
