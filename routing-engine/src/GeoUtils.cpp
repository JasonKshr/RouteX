#include "GeoUtils.h"

#include <cmath>

namespace {
constexpr double kEarthRadiusMeters = 6371000.0;

double degreesToRadians(double degrees) {
  return degrees * M_PI / 180.0;
}
}

double haversineMeters(
    double latitude1,
    double longitude1,
    double latitude2,
    double longitude2) {
  const double lat1 = degreesToRadians(latitude1);
  const double lat2 = degreesToRadians(latitude2);
  const double deltaLat = degreesToRadians(latitude2 - latitude1);
  const double deltaLon = degreesToRadians(longitude2 - longitude1);

  const double sinLat = std::sin(deltaLat / 2.0);
  const double sinLon = std::sin(deltaLon / 2.0);
  const double a = sinLat * sinLat +
                   std::cos(lat1) * std::cos(lat2) * sinLon * sinLon;
  const double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));

  return kEarthRadiusMeters * c;
}
