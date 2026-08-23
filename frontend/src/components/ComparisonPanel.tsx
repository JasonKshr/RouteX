import type { RouteResponse } from "../services/api";

type Comparison = {
  dijkstra: RouteResponse;
  astar: RouteResponse;
};

export function ComparisonPanel({ comparison }: { comparison: Comparison | null }) {
  if (!comparison) {
    return null;
  }

  return (
    <table className="comparison-table">
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
              <td>{(result.distanceMeters / 1000).toFixed(2)} km</td>
              <td>{result.nodesExplored.toLocaleString()}</td>
              <td>{result.executionTimeMs.toFixed(2)} ms</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
