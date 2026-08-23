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

const GRAPH_NODES: GraphNode[] = [
  { id: 1001, label: "Rotunda", latitude: 38.03561, longitude: -78.50341, x: 190, y: 180 },
  { id: 1002, label: "McCormick", latitude: 38.03492, longitude: -78.50182, x: 315, y: 220 },
  { id: 1003, label: "Library", latitude: 38.03412, longitude: -78.50021, x: 455, y: 270 },
  { id: 1004, label: "Corner", latitude: 38.03302, longitude: -78.49876, x: 610, y: 330 },
  { id: 1005, label: "Main St", latitude: 38.03186, longitude: -78.49748, x: 760, y: 415 },
  { id: 1006, label: "JPA", latitude: 38.03082, longitude: -78.49942, x: 565, y: 500 },
  { id: 1007, label: "Stadium", latitude: 38.03222, longitude: -78.50123, x: 410, y: 430 },
  { id: 1008, label: "Emmet", latitude: 38.03328, longitude: -78.50324, x: 270, y: 375 },
  { id: 1009, label: "Rugby", latitude: 38.03478, longitude: -78.50464, x: 140, y: 300 },
  { id: 1010, label: "Hospital", latitude: 38.03606, longitude: -78.50107, x: 470, y: 145 },
  { id: 1011, label: "14th St", latitude: 38.03512, longitude: -78.49898, x: 650, y: 205 },
  { id: 1012, label: "Downtown", latitude: 38.03204, longitude: -78.4959, x: 890, y: 350 },
];

const ROAD_SEGMENTS: RoadSegment[] = [
  { id: 5001, name: "McCormick Road", from: 1001, to: 1002, distanceMeters: 161.2, bidirectional: true },
  { id: 5002, name: "McCormick Road", from: 1002, to: 1003, distanceMeters: 164.6, bidirectional: true },
  { id: 5003, name: "University Avenue", from: 1003, to: 1004, distanceMeters: 174.8, bidirectional: true },
  { id: 5004, name: "University Avenue", from: 1004, to: 1005, distanceMeters: 169.2, bidirectional: true },
  { id: 5005, name: "Main Street", from: 1005, to: 1012, distanceMeters: 197.4, bidirectional: true },
  { id: 5006, name: "Rugby Road", from: 1001, to: 1009, distanceMeters: 158.8, bidirectional: true },
  { id: 5007, name: "Rugby Road", from: 1009, to: 1008, distanceMeters: 193.5, bidirectional: true },
  { id: 5008, name: "Emmet Street", from: 1008, to: 1007, distanceMeters: 203.3, bidirectional: true },
  { id: 5009, name: "Jefferson Park Avenue", from: 1007, to: 1006, distanceMeters: 223.6, bidirectional: true },
  { id: 5010, name: "Jefferson Park Avenue", from: 1006, to: 1005, distanceMeters: 199.8, bidirectional: true },
  { id: 5011, name: "Hospital Drive", from: 1002, to: 1010, distanceMeters: 159.5, bidirectional: true },
  { id: 5012, name: "Hospital Drive", from: 1010, to: 1011, distanceMeters: 207.7, bidirectional: true },
  { id: 5013, name: "14th Street", from: 1011, to: 1004, distanceMeters: 218.4, bidirectional: true },
  { id: 5014, name: "Elliewood Connector", from: 1008, to: 1003, distanceMeters: 292.2, bidirectional: true },
  { id: 5015, name: "Library Walk", from: 1007, to: 1003, distanceMeters: 144.5, bidirectional: true },
  { id: 5016, name: "Monroe Lane", from: 1006, to: 1004, distanceMeters: 253.7, bidirectional: true },
  { id: 5017, name: "Eastbound Main Street", from: 1004, to: 1012, distanceMeters: 282.6, bidirectional: false },
];

const nodeById = new Map(GRAPH_NODES.map((node) => [node.id, node]));
const tileZoom = 15;
const centerTile = lonLatToTile(-78.5008, 38.0338, tileZoom);
const tileOffsets = [-1, 0, 1];

function lonLatToTile(longitude: number, latitude: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) / Math.PI) /
      2) *
      scale,
  );
  return { x, y };
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
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
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
  const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    algorithm,
    path,
    explored,
    distanceMeters: path.length > 0 ? distance.get(destinationId) ?? 0 : 0,
    executionTimeMs: Math.max(0.05, finishedAt - startedAt),
    routeFound: path.length > 0,
  };
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
  const [destinationId, setDestinationId] = useState(1012);
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
          <div>
            <p className="eyebrow">OpenStreetMap route engine</p>
            <h1>RouteX</h1>
          </div>
          <span className="engine-pill">C++ Dijkstra + A*</span>
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

      <section className="map-stage" aria-label="Interactive route map">
        <div className="tile-layer" aria-hidden="true">
          {tileOffsets.flatMap((offsetY) =>
            tileOffsets.map((offsetX) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${offsetX}-${offsetY}`}
                alt=""
                src={`https://tile.openstreetmap.org/${tileZoom}/${centerTile.x + offsetX}/${centerTile.y + offsetY}.png`}
                style={{
                  left: `${((offsetX + 1) / 3) * 100}%`,
                  top: `${((offsetY + 1) / 3) * 100}%`,
                }}
              />
            )),
          )}
        </div>

        <svg className="road-layer" viewBox="0 0 1000 640" role="img" aria-label="RouteX road graph">
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
                  className="road-hit-target"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  role="button"
                  tabIndex={0}
                  aria-label={`${isClosed ? "Reopen" : "Close"} ${road.name}`}
                  onClick={() => {
                    if (closureMode) {
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
                style={{ left: `${node.x / 10}%`, top: `${node.y / 6.4}%` }}
                onClick={() => selectNode(node.id)}
                aria-label={`Select ${node.label} as ${selectionTarget}`}
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
              : "Click a node on the map to update the selected endpoint."}
          </span>
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
                {GRAPH_NODES.length} nodes / {ROAD_SEGMENTS.length} roads
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
