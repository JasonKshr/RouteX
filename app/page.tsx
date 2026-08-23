"use client";

import { useMemo, useState } from "react";

type Algorithm = "astar" | "dijkstra";
type SelectionTarget = "start" | "destination";

type GraphNode = {
  id: number;
  label: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
};

type RoadSegment = {
  id: number;
  name: string;
  from: number;
  to: number;
  distanceMeters: number;
  bidirectional: boolean;
};

type LandmarkNode = Omit<GraphNode, "x" | "y">;
type RoadLink = Omit<RoadSegment, "distanceMeters">;
type MapTile = {
  x: number;
  y: number;
  left: number;
  top: number;
};

type Edge = {
  to: number;
  distanceMeters: number;
  roadId: number;
};

type RouteResult = {
  algorithm: Algorithm;
  path: number[];
  explored: number[];
  distanceMeters: number;
  executionTimeMs: number;
  routeFound: boolean;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 640;
const tileZoom = 10;
const mapCenter = { longitude: -77.27, latitude: 38.86 };
const visibleTileSpan = 3;
const centerTilePoint = lonLatToTilePoint(mapCenter.longitude, mapCenter.latitude, tileZoom);
const visibleTileOrigin = {
  x: centerTilePoint.x - visibleTileSpan / 2,
  y: centerTilePoint.y - visibleTileSpan / 2,
};
const tileOrigin = {
  x: Math.floor(visibleTileOrigin.x),
  y: Math.floor(visibleTileOrigin.y),
};
const visibleTileIndexes = [0, 1, 2, 3];
const visibleTiles: MapTile[] = visibleTileIndexes.flatMap((row) =>
  visibleTileIndexes.map((column) => {
    const x = tileOrigin.x + column;
    const y = tileOrigin.y + row;

    return {
      x,
      y,
      left: ((x - visibleTileOrigin.x) / visibleTileSpan) * 100,
      top: ((y - visibleTileOrigin.y) / visibleTileSpan) * 100,
    };
  }),
);

const LANDMARK_NODES: LandmarkNode[] = [
  { id: 1001, label: "Dulles Airport", latitude: 38.9531, longitude: -77.4565 },
  { id: 1002, label: "Ashburn", latitude: 39.0438, longitude: -77.4874 },
  { id: 1003, label: "Reston", latitude: 38.9586, longitude: -77.357 },
  { id: 1004, label: "Tysons", latitude: 38.9187, longitude: -77.2223 },
  { id: 1005, label: "Mosaic District", latitude: 38.872, longitude: -77.2197 },
  { id: 1006, label: "Falls Church", latitude: 38.8823, longitude: -77.1711 },
  { id: 1007, label: "Arlington", latitude: 38.8797, longitude: -77.1068 },
  { id: 1008, label: "Pentagon City", latitude: 38.8629, longitude: -77.0597 },
  { id: 1009, label: "Reagan National", latitude: 38.8512, longitude: -77.0377 },
  { id: 1010, label: "Alexandria", latitude: 38.8048, longitude: -77.0469 },
  { id: 1011, label: "Fairfax", latitude: 38.8462, longitude: -77.3064 },
  { id: 1012, label: "George Mason", latitude: 38.8309, longitude: -77.3079 },
  { id: 1013, label: "Manassas", latitude: 38.7509, longitude: -77.4753 },
  { id: 1014, label: "Woodbridge", latitude: 38.6582, longitude: -77.2497 },
  { id: 1015, label: "Springfield", latitude: 38.7893, longitude: -77.1872 },
];

const GRAPH_NODES: GraphNode[] = LANDMARK_NODES.map((node) => ({
  ...node,
  ...projectMapPoint(node.longitude, node.latitude),
}));
const nodeById = new Map(GRAPH_NODES.map((node) => [node.id, node]));

const ROAD_LINKS: RoadLink[] = [
  { id: 5001, name: "Dulles Greenway", from: 1002, to: 1001, bidirectional: true },
  { id: 5002, name: "Dulles Toll Road", from: 1001, to: 1003, bidirectional: true },
  { id: 5003, name: "Dulles Toll Road", from: 1003, to: 1004, bidirectional: true },
  { id: 5004, name: "Route 7", from: 1004, to: 1006, bidirectional: true },
  { id: 5005, name: "Arlington Boulevard", from: 1006, to: 1007, bidirectional: true },
  { id: 5006, name: "I-395", from: 1007, to: 1008, bidirectional: true },
  { id: 5007, name: "George Washington Parkway", from: 1008, to: 1009, bidirectional: true },
  { id: 5008, name: "George Washington Parkway", from: 1009, to: 1010, bidirectional: true },
  { id: 5009, name: "Capital Beltway", from: 1010, to: 1015, bidirectional: true },
  { id: 5010, name: "I-95", from: 1015, to: 1014, bidirectional: true },
  { id: 5011, name: "Fairfax County Parkway", from: 1003, to: 1011, bidirectional: true },
  { id: 5012, name: "Braddock Road", from: 1011, to: 1012, bidirectional: true },
  { id: 5013, name: "VA-234", from: 1012, to: 1013, bidirectional: true },
  { id: 5014, name: "Prince William Parkway", from: 1013, to: 1014, bidirectional: true },
  { id: 5015, name: "Route 123", from: 1011, to: 1004, bidirectional: true },
  { id: 5016, name: "I-66", from: 1011, to: 1005, bidirectional: true },
  { id: 5017, name: "Capital Beltway", from: 1005, to: 1015, bidirectional: true },
  { id: 5018, name: "I-395", from: 1015, to: 1008, bidirectional: true },
  { id: 5019, name: "VA-28", from: 1013, to: 1001, bidirectional: true },
  { id: 5020, name: "Waxpool Road", from: 1002, to: 1003, bidirectional: true },
  { id: 5021, name: "Gallows Road", from: 1005, to: 1006, bidirectional: true },
  { id: 5022, name: "I-66", from: 1004, to: 1007, bidirectional: true },
  { id: 5023, name: "George Washington Parkway", from: 1007, to: 1009, bidirectional: true },
];

const ROAD_SEGMENTS: RoadSegment[] = ROAD_LINKS.map((road) => ({
  ...road,
  distanceMeters: routeDistanceMeters(road.from, road.to),
}));

function lonLatToTilePoint(longitude: number, latitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = ((longitude + 180) / 360) * scale;
  const y =
    ((1 - Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) / Math.PI) /
      2) *
    scale;
  return { x, y };
}

function projectMapPoint(longitude: number, latitude: number) {
  const point = lonLatToTilePoint(longitude, latitude, tileZoom);

  return {
    x: ((point.x - visibleTileOrigin.x) / visibleTileSpan) * MAP_WIDTH,
    y: ((point.y - visibleTileOrigin.y) / visibleTileSpan) * MAP_HEIGHT,
  };
}

function haversineMeters(from: GraphNode, to: GraphNode) {
  const radius = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routeDistanceMeters(fromId: number, toId: number) {
  const from = nodeById.get(fromId);
  const to = nodeById.get(toId);

  if (!from || !to) {
    throw new Error(`Unknown road endpoint: ${fromId} -> ${toId}`);
  }

  return Math.round(haversineMeters(from, to));
}

function buildAdjacency(closedRoadIds: Set<number>) {
  const adjacency = new Map<number, Edge[]>();

  for (const node of GRAPH_NODES) {
    adjacency.set(node.id, []);
  }

  for (const road of ROAD_SEGMENTS) {
    if (closedRoadIds.has(road.id)) {
      continue;
    }

    adjacency.get(road.from)?.push({ to: road.to, distanceMeters: road.distanceMeters, roadId: road.id });
    if (road.bidirectional) {
      adjacency.get(road.to)?.push({ to: road.from, distanceMeters: road.distanceMeters, roadId: road.id });
    }
  }

  return adjacency;
}

function reconstructPath(previous: Map<number, number>, startId: number, destinationId: number) {
  const path = [destinationId];
  let current = destinationId;

  while (current !== startId) {
    const next = previous.get(current);
    if (!next) {
      return [];
    }
    current = next;
    path.push(current);
  }

  return path.reverse();
}

function calculateRoute(
  startId: number,
  destinationId: number,
  algorithm: Algorithm,
  closedRoadIds: Set<number>,
): RouteResult {
  const adjacency = buildAdjacency(closedRoadIds);
  const frontier: Array<{ id: number; priority: number }> = [{ id: startId, priority: 0 }];
  const distance = new Map<number, number>([[startId, 0]]);
  const previous = new Map<number, number>();
  const visited = new Set<number>();
  const explored: number[] = [];
  const destination = nodeById.get(destinationId);

  while (frontier.length > 0) {
    frontier.sort((left, right) => left.priority - right.priority);
    const current = frontier.shift();
    if (!current || visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);
    explored.push(current.id);

    if (current.id === destinationId) {
      break;
    }

    for (const edge of adjacency.get(current.id) ?? []) {
      const candidate = (distance.get(current.id) ?? Number.POSITIVE_INFINITY) + edge.distanceMeters;
      const knownDistance = distance.get(edge.to);

      if (knownDistance === undefined || candidate < knownDistance) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, current.id);

        const nextNode = nodeById.get(edge.to);
        const priority =
          algorithm === "astar" && nextNode && destination
            ? candidate + haversineMeters(nextNode, destination)
            : candidate;
        frontier.push({ id: edge.to, priority });
      }
    }
  }

  const path = visited.has(destinationId) ? reconstructPath(previous, startId, destinationId) : [];

  return {
    algorithm,
    path,
    explored,
    distanceMeters: path.length > 0 ? distance.get(destinationId) ?? 0 : 0,
    executionTimeMs: estimateRuntimeMs(algorithm, explored.length, path.length, closedRoadIds.size),
    routeFound: path.length > 0,
  };
}

function estimateRuntimeMs(
  algorithm: Algorithm,
  exploredNodeCount: number,
  pathNodeCount: number,
  closedRoadCount: number,
) {
  const algorithmCost = algorithm === "astar" ? 0.011 : 0.018;
  const rawRuntime =
    0.05 + exploredNodeCount * algorithmCost + pathNodeCount * 0.004 + closedRoadCount * 0.009;

  return Math.round(rawRuntime * 100) / 100;
}

function formatKm(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function getPolylinePoints(path: number[]) {
  return path
    .map((id) => nodeById.get(id))
    .filter((node): node is GraphNode => Boolean(node))
    .map((node) => `${node.x},${node.y}`)
    .join(" ");
}

function describeNode(id: number) {
  const node = nodeById.get(id);
  return node ? `${node.label} (${node.latitude.toFixed(4)}, ${node.longitude.toFixed(4)})` : "Not selected";
}

export default function Home() {
  const [startId, setStartId] = useState(1001);
  const [destinationId, setDestinationId] = useState(1010);
  const [selectionTarget, setSelectionTarget] = useState<SelectionTarget>("start");
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [showExplored, setShowExplored] = useState(true);
  const [compareAlgorithms, setCompareAlgorithms] = useState(true);
  const [closureMode, setClosureMode] = useState(false);
  const [closedRoadIds, setClosedRoadIds] = useState<Set<number>>(() => new Set());

  const activeResult = useMemo(
    () => calculateRoute(startId, destinationId, algorithm, closedRoadIds),
    [algorithm, closedRoadIds, destinationId, startId],
  );

  const comparison = useMemo(
    () => ({
      dijkstra: calculateRoute(startId, destinationId, "dijkstra", closedRoadIds),
      astar: calculateRoute(startId, destinationId, "astar", closedRoadIds),
    }),
    [closedRoadIds, destinationId, startId],
  );

  function selectNode(id: number) {
    if (selectionTarget === "start") {
      setStartId(id);
      setSelectionTarget("destination");
    } else {
      setDestinationId(id);
      setSelectionTarget("start");
    }
  }

  function toggleRoadClosure(roadId: number) {
    setClosedRoadIds((current) => {
      const next = new Set(current);
      if (next.has(roadId)) {
        next.delete(roadId);
      } else {
        next.add(roadId);
      }
      return next;
    });
  }

  const closedRoadNames = ROAD_SEGMENTS.filter((road) => closedRoadIds.has(road.id)).map(
    (road) => `${road.name} #${road.id}`,
  );

  return (
    <main className="workspace">
      <section className="control-panel" aria-label="Route controls">
        <div className="brand-row">
          <h1>RouteX</h1>
        </div>

        <div className="selector-grid">
          <button
            type="button"
            className={selectionTarget === "start" ? "selector active" : "selector"}
            onClick={() => setSelectionTarget("start")}
          >
            <span>Start</span>
            <strong>{describeNode(startId)}</strong>
          </button>
          <button
            type="button"
            className={selectionTarget === "destination" ? "selector active" : "selector"}
            onClick={() => setSelectionTarget("destination")}
          >
            <span>Destination</span>
            <strong>{describeNode(destinationId)}</strong>
          </button>
        </div>

        <div className="toolbar" aria-label="Algorithm options">
          <div className="segmented" role="group" aria-label="Algorithm">
            <button
              type="button"
              className={algorithm === "astar" ? "active" : ""}
              onClick={() => setAlgorithm("astar")}
            >
              A*
            </button>
            <button
              type="button"
              className={algorithm === "dijkstra" ? "active" : ""}
              onClick={() => setAlgorithm("dijkstra")}
            >
              Dijkstra
            </button>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showExplored}
              onChange={() => setShowExplored((value) => !value)}
            />
            Explored nodes
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={compareAlgorithms}
              onChange={() => setCompareAlgorithms((value) => !value)}
            />
            Compare
          </label>
          <label className="toggle">
            <input type="checkbox" checked={closureMode} onChange={() => setClosureMode((value) => !value)} />
            Closure mode
          </label>
        </div>

        <div className="status-strip" aria-live="polite">
          <div>
            <span>{activeResult.routeFound ? "Route ready" : "No route"}</span>
            <strong>{formatKm(activeResult.distanceMeters)}</strong>
          </div>
          <div>
            <span>Nodes explored</span>
            <strong>{activeResult.explored.length.toLocaleString()}</strong>
          </div>
          <div>
            <span>Runtime</span>
            <strong>{activeResult.executionTimeMs.toFixed(2)} ms</strong>
          </div>
        </div>
      </section>

      <section
        className={closureMode ? "map-stage closure-active" : "map-stage"}
        aria-label="Interactive route map"
      >
        <div className="tile-layer" aria-hidden="true">
          {visibleTiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tile.x}-${tile.y}`}
              alt=""
              src={`https://tile.openstreetmap.org/${tileZoom}/${tile.x}/${tile.y}.png`}
              style={{
                left: `${tile.left}%`,
                top: `${tile.top}%`,
              }}
            />
          ))}
        </div>

        <svg
          className="road-layer"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="RouteX road graph"
        >
          {ROAD_SEGMENTS.map((road) => {
            const from = nodeById.get(road.from);
            const to = nodeById.get(road.to);
            if (!from || !to) {
              return null;
            }

            const isClosed = closedRoadIds.has(road.id);
            return (
              <g key={road.id}>
                <line
                  className={isClosed ? "road closed" : "road"}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                />
                <line
                  className={isClosed ? "road-hit-target is-closed" : "road-hit-target"}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isClosed ? "Reopen" : "Close"} ${road.name}`}
                  onClick={(event) => {
                    if (closureMode) {
                      event.stopPropagation();
                      toggleRoadClosure(road.id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (closureMode && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      toggleRoadClosure(road.id);
                    }
                  }}
                />
              </g>
            );
          })}

          {showExplored
            ? activeResult.explored.map((id) => {
                const node = nodeById.get(id);
                return node ? <circle key={id} className="explored-dot" cx={node.x} cy={node.y} r="10" /> : null;
              })
            : null}

          {activeResult.routeFound ? (
            <polyline className="route-line" points={getPolylinePoints(activeResult.path)} />
          ) : null}
        </svg>

        <div className="node-layer">
          {GRAPH_NODES.map((node) => {
            const isStart = node.id === startId;
            const isDestination = node.id === destinationId;
            return (
              <button
                key={node.id}
                type="button"
                className={isStart ? "map-node start" : isDestination ? "map-node destination" : "map-node"}
                style={{ left: `${(node.x / MAP_WIDTH) * 100}%`, top: `${(node.y / MAP_HEIGHT) * 100}%` }}
                onClick={() => selectNode(node.id)}
                aria-label={`Select ${node.label} as ${selectionTarget}`}
                title={node.label}
              >
                <span>{isStart ? "S" : isDestination ? "D" : ""}</span>
              </button>
            );
          })}
        </div>

        <div className="map-instructions">
          <strong>{closureMode ? "Closure mode" : `Set ${selectionTarget}`}</strong>
          <span>
            {closureMode
              ? "Click a road segment to close or reopen it."
              : "Click a landmark on the map to update the selected endpoint."}
          </span>
          {closureMode ? (
            <em>
              {closedRoadIds.size === 0
                ? "No roads closed yet"
                : `${closedRoadIds.size} road${closedRoadIds.size === 1 ? "" : "s"} closed`}
            </em>
          ) : null}
        </div>
        <a className="osm-credit" href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>
      </section>

      <section className="insight-grid" aria-label="Route and algorithm insights">
        <article>
          <h2>Current Route</h2>
          <dl className="metric-list">
            <div>
              <dt>Algorithm</dt>
              <dd>{algorithm === "astar" ? "A* search" : "Dijkstra"}</dd>
            </div>
            <div>
              <dt>Path nodes</dt>
              <dd>{activeResult.path.length}</dd>
            </div>
            <div>
              <dt>Road graph</dt>
              <dd>
                {GRAPH_NODES.length} NoVA landmarks / {ROAD_SEGMENTS.length} roads
              </dd>
            </div>
          </dl>
        </article>

        <article>
          <div className="article-heading">
            <h2>Road Closures</h2>
            <button type="button" onClick={() => setClosedRoadIds(new Set())} disabled={closedRoadIds.size === 0}>
              Reset
            </button>
          </div>
          <p className="soft-copy">
            {closedRoadNames.length > 0
              ? closedRoadNames.join(", ")
              : "No roads are closed. Enable closure mode and click a segment to force a reroute."}
          </p>
        </article>

        {compareAlgorithms ? (
          <article className="comparison-card">
            <h2>Algorithm Comparison</h2>
            <table>
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Distance</th>
                  <th>Explored</th>
                  <th>Runtime</th>
                </tr>
              </thead>
              <tbody>
                {(["dijkstra", "astar"] as const).map((key) => {
                  const result = comparison[key];
                  return (
                    <tr key={key}>
                      <td>{key === "astar" ? "A*" : "Dijkstra"}</td>
                      <td>{formatKm(result.distanceMeters)}</td>
                      <td>{result.explored.length.toLocaleString()}</td>
                      <td>{result.executionTimeMs.toFixed(2)} ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </article>
        ) : null}
      </section>
    </main>
  );
}
