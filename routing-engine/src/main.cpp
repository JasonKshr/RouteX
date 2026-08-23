#include "AStar.h"
#include "Dijkstra.h"
#include "GeoUtils.h"
#include "Graph.h"

#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace {
std::vector<std::string> split(const std::string& line, char delimiter) {
  std::vector<std::string> parts;
  std::stringstream stream(line);
  std::string part;

  while (std::getline(stream, part, delimiter)) {
    parts.push_back(part);
  }

  return parts;
}

std::unordered_map<std::string, std::string> parseArgs(int argc, char** argv) {
  std::unordered_map<std::string, std::string> args;

  for (int index = 1; index + 1 < argc; index += 2) {
    args[argv[index]] = argv[index + 1];
  }

  return args;
}

void loadNodes(RoadGraph& graph, const std::string& path) {
  std::ifstream file(path);
  if (!file) {
    throw std::runtime_error("could not open nodes file: " + path);
  }

  std::string line;
  std::getline(file, line);

  while (std::getline(file, line)) {
    if (line.empty()) {
      continue;
    }

    const auto columns = split(line, ',');
    if (columns.size() < 3) {
      continue;
    }

    graph.addNode({
        std::stoll(columns[0]),
        std::stod(columns[1]),
        std::stod(columns[2]),
    });
  }
}

void loadEdges(RoadGraph& graph, const std::string& path) {
  std::ifstream file(path);
  if (!file) {
    throw std::runtime_error("could not open edges file: " + path);
  }

  std::string line;
  std::getline(file, line);

  while (std::getline(file, line)) {
    if (line.empty()) {
      continue;
    }

    const auto columns = split(line, ',');
    if (columns.size() < 5) {
      continue;
    }

    const long long source = std::stoll(columns[0]);
    const long long destination = std::stoll(columns[1]);
    const double distance = std::stod(columns[2]);
    const long long roadId = std::stoll(columns[3]);
    const bool bidirectional = columns[4] != "false";

    graph.addEdge(source, {destination, distance, distance, roadId, true});
    if (bidirectional) {
      graph.addEdge(destination, {source, distance, distance, roadId, true});
    }
  }
}

std::string coordinateJson(const RoadGraph& graph, const std::vector<long long>& ids) {
  std::ostringstream json;
  json << "[";

  for (std::size_t index = 0; index < ids.size(); index += 1) {
    const auto& node = graph.getNode(ids[index]);
    if (index > 0) {
      json << ",";
    }
    json << "[" << node.longitude << "," << node.latitude << "]";
  }

  json << "]";
  return json.str();
}

void applyClosures(RoadGraph& graph, const std::string& closures) {
  if (closures.empty() || closures == "none") {
    return;
  }

  for (const auto& token : split(closures, ',')) {
    if (!token.empty()) {
      graph.closeRoad(std::stoll(token));
    }
  }
}
}

int main(int argc, char** argv) {
  try {
    const auto args = parseArgs(argc, argv);

    RoadGraph graph;
    loadNodes(graph, args.at("--nodes"));
    loadEdges(graph, args.at("--edges"));
    applyClosures(graph, args.count("--closed-roads") ? args.at("--closed-roads") : "");

    const long long start = graph.nearestNode(
        std::stod(args.at("--start-lat")),
        std::stod(args.at("--start-lon")));
    const long long destination = graph.nearestNode(
        std::stod(args.at("--destination-lat")),
        std::stod(args.at("--destination-lon")));
    const std::string algorithm = args.count("--algorithm") ? args.at("--algorithm") : "astar";

    const RouteResult result =
        algorithm == "dijkstra" ? runDijkstra(graph, start, destination) : runAStar(graph, start, destination);

    std::cout << "{";
    std::cout << "\"routeFound\":" << (result.routeFound ? "true" : "false") << ",";
    std::cout << "\"startNode\":" << start << ",";
    std::cout << "\"destinationNode\":" << destination << ",";
    std::cout << "\"distanceMeters\":" << result.totalDistance << ",";
    std::cout << "\"nodesExplored\":" << result.nodesExplored << ",";
    std::cout << "\"executionTimeMs\":" << result.executionTimeMs << ",";
    std::cout << "\"algorithm\":\"" << algorithm << "\",";
    std::cout << "\"pathNodeIds\":[";
    for (std::size_t index = 0; index < result.path.size(); index += 1) {
      if (index > 0) {
        std::cout << ",";
      }
      std::cout << result.path[index];
    }
    std::cout << "],";
    std::cout << "\"route\":" << coordinateJson(graph, result.path) << ",";
    std::cout << "\"exploredNodes\":" << coordinateJson(graph, result.exploredNodes);
    std::cout << "}\n";
  } catch (const std::exception& error) {
    std::cerr << "RouteX routing error: " << error.what() << "\n";
    return 1;
  }

  return 0;
}
