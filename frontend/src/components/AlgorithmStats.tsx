import type { RouteResponse } from "../services/api";

function metersToKilometers(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

export function AlgorithmStats({ result }: { result: RouteResponse | null }) {
  if (!result) {
    return <p>Select two map points and calculate a route.</p>;
  }

  return (
    <dl className="stats-grid">
      <div>
        <dt>Distance</dt>
        <dd>{metersToKilometers(result.distanceMeters)}</dd>
      </div>
      <div>
        <dt>Runtime</dt>
        <dd>{result.executionTimeMs.toFixed(2)} ms</dd>
      </div>
      <div>
        <dt>Nodes explored</dt>
        <dd>{result.nodesExplored.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Algorithm</dt>
        <dd>{result.algorithm === "astar" ? "A*" : "Dijkstra"}</dd>
      </div>
    </dl>
  );
}
