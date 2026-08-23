import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RouteX — Routing Algorithm Visualizer",
  description:
    "A route-planning and graph algorithm visualization project using OpenStreetMap data, C++ Dijkstra, A*, FastAPI, and React.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "RouteX",
    description:
      "Compare Dijkstra and A* on an OpenStreetMap-style road graph with explored-node visualization and simulated road closures.",
  },
  twitter: {
    card: "summary",
    title: "RouteX",
    description:
      "Visualize route planning, explored nodes, and automatic rerouting with Dijkstra and A*.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
