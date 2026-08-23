#include "Graph.h"

#include "GeoUtils.h"

#include <limits>
#include <stdexcept>

void RoadGraph::addNode(const Node& node) {
  nodes[node.id] = node;
  adjacencyList.try_emplace(node.id);
}

void RoadGraph::addEdge(long long source, const Edge& edge) {
  if (!hasNode(source)) {
    throw std::invalid_argument("source node is not present in the graph");
  }
  if (!hasNode(edge.destination)) {
    throw std::invalid_argument("destination node is not present in the graph");
  }

  adjacencyList[source].push_back(edge);
}

bool RoadGraph::hasNode(long long id) const {
  return nodes.find(id) != nodes.end();
}

const Node& RoadGraph::getNode(long long id) const {
  const auto iterator = nodes.find(id);
  if (iterator == nodes.end()) {
    throw std::out_of_range("node is not present in the graph");
  }

  return iterator->second;
}

const std::vector<Edge>& RoadGraph::getNeighbors(long long id) const {
  static const std::vector<Edge> empty;
  const auto iterator = adjacencyList.find(id);
  if (iterator == adjacencyList.end()) {
    return empty;
  }

  return iterator->second;
}

std::vector<long long> RoadGraph::getNodeIds() const {
  std::vector<long long> ids;
  ids.reserve(nodes.size());

  for (const auto& [id, _node] : nodes) {
    ids.push_back(id);
  }

  return ids;
}

long long RoadGraph::nearestNode(double latitude, double longitude) const {
  if (nodes.empty()) {
    throw std::runtime_error("graph has no nodes");
  }

  long long nearestId = nodes.begin()->first;
  double bestDistance = std::numeric_limits<double>::infinity();

  for (const auto& [id, node] : nodes) {
    const double distance = haversineMeters(latitude, longitude, node.latitude, node.longitude);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearestId = id;
    }
  }

  return nearestId;
}

bool RoadGraph::closeRoad(long long roadId) {
  bool changed = false;
  for (auto& [_source, edges] : adjacencyList) {
    for (auto& edge : edges) {
      if (edge.roadId == roadId && edge.enabled) {
        edge.enabled = false;
        changed = true;
      }
    }
  }

  return changed;
}

bool RoadGraph::reopenRoad(long long roadId) {
  bool changed = false;
  for (auto& [_source, edges] : adjacencyList) {
    for (auto& edge : edges) {
      if (edge.roadId == roadId && !edge.enabled) {
        edge.enabled = true;
        changed = true;
      }
    }
  }

  return changed;
}

void RoadGraph::resetClosures() {
  for (auto& [_source, edges] : adjacencyList) {
    for (auto& edge : edges) {
      edge.enabled = true;
    }
  }
}

std::size_t RoadGraph::nodeCount() const {
  return nodes.size();
}

std::size_t RoadGraph::edgeCount() const {
  std::size_t count = 0;

  for (const auto& [_source, edges] : adjacencyList) {
    count += edges.size();
  }

  return count;
}
