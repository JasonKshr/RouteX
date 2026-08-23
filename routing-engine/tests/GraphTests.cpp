#include "GeoUtils.h"
#include "Graph.h"

#include <cassert>

int main() {
  RoadGraph graph;
  graph.addNode({1, 38.0356, -78.5034});
  graph.addNode({2, 38.0345, -78.5002});
  graph.addEdge(1, {2, 310.0, 310.0, 9001, true});

  assert(graph.nodeCount() == 2);
  assert(graph.edgeCount() == 1);
  assert(graph.getNeighbors(1).size() == 1);
  assert(graph.nearestNode(38.0357, -78.5032) == 1);

  assert(graph.closeRoad(9001));
  assert(!graph.getNeighbors(1).front().enabled);
  assert(graph.reopenRoad(9001));
  assert(graph.getNeighbors(1).front().enabled);

  const double distance = haversineMeters(38.0356, -78.5034, 38.0345, -78.5002);
  assert(distance > 250.0);
  assert(distance < 350.0);

  return 0;
}
