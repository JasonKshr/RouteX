#pragma once

#include "Graph.h"
#include "RouteResult.h"

RouteResult runDijkstra(const RoadGraph& graph, long long startId, long long destinationId);
