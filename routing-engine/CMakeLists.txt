cmake_minimum_required(VERSION 3.16)
project(RouteXRoutingEngine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include_directories(include)

set(ROUTEX_ENGINE_SOURCES
    src/Graph.cpp
    src/GeoUtils.cpp
    src/Dijkstra.cpp
    src/AStar.cpp)

add_library(routex_engine ${ROUTEX_ENGINE_SOURCES})
add_executable(routex_cli src/main.cpp)
target_link_libraries(routex_cli PRIVATE routex_engine)

enable_testing()

add_executable(GraphTests tests/GraphTests.cpp)
target_link_libraries(GraphTests PRIVATE routex_engine)
add_test(NAME GraphTests COMMAND GraphTests)

add_executable(DijkstraTests tests/DijkstraTests.cpp)
target_link_libraries(DijkstraTests PRIVATE routex_engine)
add_test(NAME DijkstraTests COMMAND DijkstraTests)

add_executable(AStarTests tests/AStarTests.cpp)
target_link_libraries(AStarTests PRIVATE routex_engine)
add_test(NAME AStarTests COMMAND AStarTests)
