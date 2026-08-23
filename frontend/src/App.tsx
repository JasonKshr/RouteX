import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { AlgorithmStats } from "./components/AlgorithmStats";
import { RouteMap } from "./components/Map";
import { RouteControls } from "./components/RouteControls";
import { calculateRoute, type Algorithm, type Coordinate, type RouteResponse } from "./services/api";

export default function App() {
  const [start, setStart] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [nextPick, setNextPick] = useState<"start" | "destination">("start");
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [showExplored, setShowExplored] = useState(false);
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePick(coordinate: Coordinate) {
    if (nextPick === "start") {
      setStart(coordinate);
      setNextPick("destination");
    } else {
      setDestination(coordinate);
      setNextPick("start");
    }
  }

  async function handleCalculate() {
    if (!start || !destination) {
      setError("Choose a start and destination first.");
      return;
    }

    setError(null);
    setResult(await calculateRoute(start, destination, algorithm));
  }

  return (
    <main>
      <header>
        <h1>RouteX</h1>
        <p>Real-world routing and graph algorithm visualization.</p>
      </header>
      <RouteControls
        algorithm={algorithm}
        showExplored={showExplored}
        onAlgorithmChange={setAlgorithm}
        onCalculate={handleCalculate}
        onToggleExplored={() => setShowExplored((value) => !value)}
      />
      {error ? <p role="alert">{error}</p> : null}
      <RouteMap start={start} destination={destination} result={result} showExplored={showExplored} onPick={handlePick} />
      <AlgorithmStats result={result} />
    </main>
  );
}
