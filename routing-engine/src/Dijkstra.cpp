#include "Dijkstra.h"

#include <algorithm>
#include <chrono>
#include <functional>
#include <limits>
#include <queue>
#include <unordered_map>
#include <unordered_set>

namespace {
using QueueItem = std::pair<double, long long>;

std::vector<long long> reconstructPath(
    const std::unordered_map<long long, long long>& previous,
    long long startId,
    long long destinationId) {
  std::vector<long long> path;
  long long current = destinationId;
  path.push_back(current);

  while (current != startId) {
    const auto iterator = previous.find(current);
    if (iterator == previous.end()) {
      return {};
    }
    current = iterator->second;
    path.push_back(current);
  }

  std::reverse(path.begin(), path.end());
  return path;
}
}

RouteResult runDijkstra(const RoadGraph& graph, long long startId, long long destinationId) {
  const auto startedAt = std::chrono::high_resolution_clock::now();
  RouteResult result;

  if (!graph.hasNode(startId) || !graph.hasNode(destinationId)) {
    return result;
  }

  if (startId == destinationId) {
    result.path = {startId};
    result.routeFound = true;
    result.executionTimeMs = 0.0;
    return result;
  }

  std::priority_queue<QueueItem, std::vector<QueueItem>, std::greater<QueueItem>> frontier;
  std::unordered_map<long long, double> distance;
  std::unordered_map<long long, long long> previous;
  std::unordered_set<long long> visited;

  distance[startId] = 0.0;
  frontier.push({0.0, startId});

  while (!frontier.empty()) {
    const auto [currentDistance, current] = frontier.top();
    frontier.pop();

    if (visited.find(current) != visited.end()) {
      continue;
    }

    visited.insert(current);
    result.exploredNodes.push_back(current);

    if (current == destinationId) {
      break;
    }

    for (const auto& edge : graph.getNeighbors(current)) {
      if (!edge.enabled) {
        continue;
      }

      const double candidate = currentDistance + edge.travelCost;
      const auto existing = distance.find(edge.destination);
      if (existing == distance.end() || candidate < existing->second) {
        distance[edge.destination] = candidate;
        previous[edge.destination] = current;
        frontier.push({candidate, edge.destination});
      }
    }
  }

  const auto destinationDistance = distance.find(destinationId);
  if (destinationDistance != distance.end() && visited.find(destinationId) != visited.end()) {
    result.path = reconstructPath(previous, startId, destinationId);
    result.totalDistance = destinationDistance->second;
    result.routeFound = !result.path.empty();
  }

  const auto finishedAt = std::chrono::high_resolution_clock::now();
  result.nodesExplored = result.exploredNodes.size();
  result.executionTimeMs =
      std::chrono::duration<double, std::milli>(finishedAt - startedAt).count();

  return result;
}
