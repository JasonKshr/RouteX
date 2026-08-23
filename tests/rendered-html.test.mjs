import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the RouteX shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /RouteX/i);
  assert.match(html, /Routing Algorithm Visualizer/i);
  assert.doesNotMatch(html, /Aegis Vault|Encrypted Personal Knowledge Vault|codex-preview/i);
});

test("ships RouteX architecture and algorithm source", async () => {
  const [page, layout, packageJson, graphHeader, astar, dijkstra, api] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../routing-engine/include/Graph.h", import.meta.url), "utf8"),
    readFile(new URL("../routing-engine/src/AStar.cpp", import.meta.url), "utf8"),
    readFile(new URL("../routing-engine/src/Dijkstra.cpp", import.meta.url), "utf8"),
    readFile(new URL("../backend/app/main.py", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<h1>RouteX<\/h1>/);
  assert.match(page, /Dulles Airport/);
  assert.match(page, /Tysons/);
  assert.match(page, /Alexandria/);
  assert.match(page, /NoVA landmarks/);
  assert.match(page, /calculateRoute/);
  assert.match(page, /Closure mode/);
  assert.match(page, /Algorithm Comparison/);
  assert.match(layout, /RouteX — Routing Algorithm Visualizer/);
  assert.match(packageJson, /"name": "routex"/);
  assert.match(graphHeader, /class RoadGraph/);
  assert.match(astar, /heuristic/);
  assert.match(dijkstra, /std::priority_queue/);
  assert.match(api, /FastAPI/);
  assert.doesNotMatch(
    page,
    /AES-GCM|PBKDF2|indexedDB|OpenStreetMap route engine|C\+\+ Dijkstra \+ A\*|Rotunda|McCormick Road/,
  );
});

test("keeps closure-mode road edges clickable", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /closure-active/);
  assert.match(page, /road-hit-target is-closed/);
  assert.match(styles, /\.node-layer\s*\{[\s\S]*pointer-events:\s*none;/);
  assert.match(styles, /\.map-node\s*\{[\s\S]*pointer-events:\s*auto;/);
  assert.match(styles, /\.road-hit-target\s*\{[\s\S]*pointer-events:\s*stroke;/);
  assert.match(styles, /\.route-line\s*\{[\s\S]*pointer-events:\s*none;/);
});
