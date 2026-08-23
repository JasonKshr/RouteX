#include "Dijkstra.h"
#include "Graph.h"

#include <cassert>
#include <cmath>

namespace {
RoadGraph buildGraph() {
  RoadGraph graph;
  graph.addNode({1, 0.0, 0.0});
  graph.addNode({2, 0.0, 0.001});
  graph.addNode({3, 0.0, 0.002});
  graph.addNode({4, 0.001, 0.001});

  graph.addEdge(1, {2, 1.0, 1.0, 10, true});
  graph.addEdge(2, {3, 1.0, 1.0, 11, true});
  graph.addEdge(1, {3, 5.0, 5.0, 12, true});
  graph.addEdge(1, {4, 3.0, 3.0, 13, true});
  graph.addEdge(4, {3, 4.0, 4.0, 14, true});

  return graph;
}
}

int main() {
  RoadGraph graph = buildGraph();

  const RouteResult route = runDijkstra(graph, 1, 3);
  assert(route.routeFound);
  assert(route.path.size() == 3);
  assert(route.path[0] == 1);
  assert(route.path[1] == 2);
  assert(route.path[2] == 3);
  assert(std::fabs(route.totalDistance - 2.0) < 0.0001);

  graph.closeRoad(11);
  const RouteResult reroute = runDijkstra(graph, 1, 3);
  assert(reroute.routeFound);
  assert(reroute.path.size() == 2);
  assert(reroute.path[0] == 1);
  assert(reroute.path[1] == 3);
  assert(std::fabs(reroute.totalDistance - 5.0) < 0.0001);

  const RouteResult sameNode = runDijkstra(graph, 1, 1);
  assert(sameNode.routeFound);
  assert(sameNode.totalDistance == 0.0);
  assert(sameNode.path.size() == 1);

  const RouteResult missing = runDijkstra(graph, 1, 999);
  assert(!missing.routeFound);

  return 0;
}
