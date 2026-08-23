#pragma once

#include <cstddef>
#include <vector>

struct RouteResult {
  std::vector<long long> path;
  std::vector<long long> exploredNodes;
  double totalDistance = 0.0;
  double executionTimeMs = 0.0;
  std::size_t nodesExplored = 0;
  bool routeFound = false;
};
