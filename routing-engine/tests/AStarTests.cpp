#include "AStar.h"
#include "Dijkstra.h"
#include "Graph.h"

#include <cassert>
#include <cmath>

namespace {
RoadGraph buildGraph() {
  RoadGraph graph;
  graph.addNode({1, 38.0356, -78.5034});
  graph.addNode({2, 38.0346, -78.5017});
  graph.addNode({3, 38.0335, -78.4995});
  graph.addNode({4, 38.0318, -78.4983});
  graph.addNode({5, 38.0332, -78.5041});

  graph.addEdge(1, {2, 190.0, 190.0, 20, true});
  graph.addEdge(2, {3, 220.0, 220.0, 21, true});
  graph.addEdge(3, {4, 230.0, 230.0, 22, true});
  graph.addEdge(1, {5, 310.0, 310.0, 23, true});
  graph.addEdge(5, {4, 520.0, 520.0, 24, true});

  return graph;
}
}

int main() {
  RoadGraph graph = buildGraph();

  const RouteResult dijkstra = runDijkstra(graph, 1, 4);
  const RouteResult astar = runAStar(graph, 1, 4);

  assert(dijkstra.routeFound);
  assert(astar.routeFound);
  assert(std::fabs(dijkstra.totalDistance - astar.totalDistance) < 0.0001);
  assert(astar.path.front() == 1);
  assert(astar.path.back() == 4);

  graph.closeRoad(21);
  const RouteResult reroute = runAStar(graph, 1, 4);
  assert(reroute.routeFound);
  assert(reroute.path.size() == 3);
  assert(reroute.path[0] == 1);
  assert(reroute.path[1] == 5);
  assert(reroute.path[2] == 4);

  return 0;
}
