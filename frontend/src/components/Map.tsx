import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import type { Coordinate, RouteResponse } from "../services/api";

type Props = {
  start: Coordinate | null;
  destination: Coordinate | null;
  result: RouteResponse | null;
  showExplored: boolean;
  onPick: (coordinate: Coordinate) => void;
};

function Picker({ onPick }: { onPick: (coordinate: Coordinate) => void }) {
  useMapEvents({
    click(event) {
      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export function RouteMap({ start, destination, result, showExplored, onPick }: Props) {
  const route = result?.route.map(([longitude, latitude]) => [latitude, longitude] as [number, number]) ?? [];
  const explored =
    showExplored && result
      ? result.exploredNodes.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
      : [];

  return (
    <MapContainer center={[38.034, -78.501]} zoom={15} className="route-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Picker onPick={onPick} />
      {start ? <Marker position={[start.latitude, start.longitude]} /> : null}
      {destination ? <Marker position={[destination.latitude, destination.longitude]} /> : null}
      {route.length > 0 ? <Polyline positions={route} pathOptions={{ color: "#0f766e", weight: 6 }} /> : null}
      {explored.map((point) => (
        <Polyline key={point.join(",")} positions={[point, point]} pathOptions={{ color: "#f97316", weight: 6 }} />
      ))}
    </MapContainer>
  );
}
