import type { Algorithm } from "../services/api";

type Props = {
  algorithm: Algorithm;
  showExplored: boolean;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  onCalculate: () => void;
  onToggleExplored: () => void;
};

export function RouteControls({
  algorithm,
  showExplored,
  onAlgorithmChange,
  onCalculate,
  onToggleExplored,
}: Props) {
  return (
    <section className="route-controls">
      <label>
        Algorithm
        <select value={algorithm} onChange={(event) => onAlgorithmChange(event.target.value as Algorithm)}>
          <option value="astar">A*</option>
          <option value="dijkstra">Dijkstra</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={showExplored} onChange={onToggleExplored} />
        Show explored nodes
      </label>
      <button type="button" onClick={onCalculate}>
        Calculate Route
      </button>
    </section>
  );
}
