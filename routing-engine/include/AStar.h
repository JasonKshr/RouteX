#pragma once

#include "Graph.h"
#include "RouteResult.h"

RouteResult runAStar(const RoadGraph& graph, long long startId, long long destinationId);
