export type Algorithm = "astar" | "dijkstra";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteResponse = {
  route: [number, number][];
  exploredNodes: [number, number][];
  pathNodeIds: number[];
  distanceMeters: number;
  nodesExplored: number;
  executionTimeMs: number;
  algorithm: Algorithm;
  routeFound: boolean;
};

const API_BASE_URL = import.meta.env.VITE_ROUTEX_API_URL ?? "http://localhost:8000";

export async function calculateRoute(
  start: Coordinate,
  destination: Coordinate,
  algorithm: Algorithm,
): Promise<RouteResponse> {
  const response = await fetch(`${API_BASE_URL}/route`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ start, destination, algorithm }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function compareRoute(start: Coordinate, destination: Coordinate) {
  const response = await fetch(`${API_BASE_URL}/route/compare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ start, destination, algorithm: "astar" }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function closeRoad(roadId: number) {
  await fetch(`${API_BASE_URL}/roads/close`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ roadId }),
  });
}
