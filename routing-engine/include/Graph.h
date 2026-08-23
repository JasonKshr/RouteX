#pragma once

#include "Edge.h"
#include "Node.h"

#include <cstddef>
#include <unordered_map>
#include <vector>

class RoadGraph {
private:
  std::unordered_map<long long, Node> nodes;
  std::unordered_map<long long, std::vector<Edge>> adjacencyList;

public:
  void addNode(const Node& node);
  void addEdge(long long source, const Edge& edge);

  bool hasNode(long long id) const;
  const Node& getNode(long long id) const;
  const std::vector<Edge>& getNeighbors(long long id) const;
  std::vector<long long> getNodeIds() const;

  long long nearestNode(double latitude, double longitude) const;

  bool closeRoad(long long roadId);
  bool reopenRoad(long long roadId);
  void resetClosures();

  std::size_t nodeCount() const;
  std::size_t edgeCount() const;
};
