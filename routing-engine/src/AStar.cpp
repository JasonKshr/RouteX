#include "AStar.h"

#include "GeoUtils.h"

#include <algorithm>
#include <chrono>
#include <functional>
#include <limits>
#include <queue>
#include <unordered_map>
#include <unordered_set>

namespace {
using QueueItem = std::pair<double, long long>;

double heuristic(const RoadGraph& graph, long long nodeId, long long destinationId) {
  const Node& node = graph.getNode(nodeId);
  const Node& destination = graph.getNode(destinationId);
  return haversineMeters(
      node.latitude,
      node.longitude,
      destination.latitude,
      destination.longitude);
}

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

RouteResult runAStar(const RoadGraph& graph, long long startId, long long destinationId) {
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
  std::unordered_map<long long, double> gScore;
  std::unordered_map<long long, long long> previous;
  std::unordered_set<long long> visited;

  gScore[startId] = 0.0;
  frontier.push({heuristic(graph, startId, destinationId), startId});

  while (!frontier.empty()) {
    const auto [_priority, current] = frontier.top();
    frontier.pop();

    if (visited.find(current) != visited.end()) {
      continue;
    }

    visited.insert(current);
    result.exploredNodes.push_back(current);

    if (current == destinationId) {
      break;
    }

    const double currentCost = gScore[current];
    for (const auto& edge : graph.getNeighbors(current)) {
      if (!edge.enabled) {
        continue;
      }

      const double candidate = currentCost + edge.travelCost;
      const auto existing = gScore.find(edge.destination);
      if (existing == gScore.end() || candidate < existing->second) {
        gScore[edge.destination] = candidate;
        previous[edge.destination] = current;
        frontier.push({candidate + heuristic(graph, edge.destination, destinationId), edge.destination});
      }
    }
  }

  const auto destinationDistance = gScore.find(destinationId);
  if (destinationDistance != gScore.end() && visited.find(destinationId) != visited.end()) {
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
