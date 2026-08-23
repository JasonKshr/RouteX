# RouteX

RouteX is a route-planning and graph algorithm visualization project. It models an OpenStreetMap road network as a weighted adjacency-list graph, runs shortest-path algorithms in C++, exposes routing through a thin FastAPI layer, and visualizes the route, explored nodes, and temporary road closures in React.

The project is meant to show graph algorithms in a realistic software system instead of as isolated textbook exercises.

## Features

- OpenStreetMap-style road-network graph data
- C++17 routing engine with a modular `RoadGraph`
- Manual Dijkstra implementation using `std::priority_queue`
- Manual A* implementation using a Haversine geographic heuristic
- Runtime, path distance, path nodes, and explored-node instrumentation
- Dynamic road closures through disabled graph edges
- Automatic rerouting around closed road segments
- FastAPI bridge for `/route`, `/route/compare`, `/roads/close`, `/roads/open`, and `/graph/stats`
- React interface with OSM map tiles, route polyline, explored-node overlay, and comparison table
- OSM XML preprocessing script that writes `nodes.csv` and `edges.csv`

## Architecture

```text
OpenStreetMap
      ↓
Preprocessor
      ↓
Road Graph
      ↓
C++ Routing Engine
      ↓
Python FastAPI
      ↓
React UI
```

## Repository Layout

```text
routing-engine/     C++ graph model, Dijkstra, A*, CLI, and unit tests
backend/            FastAPI API layer that calls the compiled C++ engine
frontend/           React-Leaflet frontend package for API-backed map usage
app/                Sites-ready React demo UI for the RouteX workflow
data/raw/           Small Northern Virginia OSM XML sample
data/processed/     Processed graph CSV files
scripts/            OSM preprocessing utilities
tests/              Render/source smoke tests for the Sites app
```

## Run The Sites Demo

RouteX needs Node.js 22.13.0 or newer. Check your version first:

```bash
node -v
```

If you see Node 18, install Node 22 LTS or newer, reopen Terminal, and run the commands below.

```bash
npm install
npm run dev
```

Do not run `npm audit fix` just to start the project. It can upgrade beta framework packages into an incompatible set. Use the committed `package-lock.json` unless you are intentionally doing dependency maintenance.

The main demo lets you select start and destination nodes, switch between A* and Dijkstra, show explored nodes, compare algorithm performance, and close road segments to force a reroute.

## Build The C++ Routing Engine

```bash
cd routing-engine
cmake -S . -B build
cmake --build build
ctest --test-dir build
```

The CLI produced at `routing-engine/build/routex_cli` loads `nodes.csv` and `edges.csv`, snaps geographic coordinates to the nearest road-network nodes, applies temporary road closures, and returns route JSON.

Example:

```bash
routing-engine/build/routex_cli \
  --nodes data/processed/nodes.csv \
  --edges data/processed/edges.csv \
  --start-lat 38.9531 \
  --start-lon -77.4565 \
  --destination-lat 38.8048 \
  --destination-lon -77.0469 \
  --algorithm astar \
  --closed-roads none
```

## Run The FastAPI Backend

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

The API expects the C++ engine to be built first so it can call `routing-engine/build/routex_cli`.

## Preprocess OSM Data

```bash
python3 scripts/preprocess_map.py data/raw/northern-va-landmarks.osm --output-dir data/processed
```

For a larger real dataset, download a city or neighborhood OSM XML extract, place it in `data/raw/`, and run the same script. The script preserves drivable roads, calculates Haversine segment distances, respects one-way tags, and outputs graph-ready CSV files.

## Algorithms

RouteX keeps graph representation separate from pathfinding:

- `RoadGraph` owns nodes, adjacency lists, and closure mutations.
- `runDijkstra` explores the graph by known shortest distance.
- `runAStar` uses `f(n) = g(n) + h(n)` with Haversine distance as the heuristic.
- Both return `RouteResult` with path, explored nodes, total distance, runtime, and route-found status.

## Resume Talking Points

- Implements Dijkstra and A* from scratch in C++.
- Uses realistic sparse-graph modeling for road networks.
- Demonstrates C++/Python/React system boundaries.
- Converts OSM data into a routing graph instead of hardcoding textbook examples.
- Visualizes explored nodes so users can see why heuristic search can reduce work.
- Supports dynamic graph mutations through road closures and automatic rerouting.
