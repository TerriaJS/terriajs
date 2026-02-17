import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { TERRAIN_TILE, LAYER_JSON } from "./terrain";

// Default handlers that persist across worker.resetHandlers() calls.
// These serve minimal valid responses for Cesium Ion terrain loading
// so tests never hit real external APIs.
export const worker = setupWorker(
  // Ion asset endpoint → return a mock terrain server URL
  http.get("https://api.cesium.com/v1/assets/:assetId/endpoint", ({ params }) =>
    HttpResponse.json({
      type: "TERRAIN",
      url: `https://assets.cesium.com/${params.assetId}/`,
      accessToken: "mock-token"
    })
  ),

  // Catch-all for other api.cesium.com requests
  http.all("https://api.cesium.com/*", () => HttpResponse.error()),

  // Serve terrain data from *.cesium.com subdomains
  http.get("https://*.cesium.com/*", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/layer.json")) {
      return HttpResponse.json(LAYER_JSON);
    }
    if (url.pathname.endsWith(".terrain")) {
      return new HttpResponse(TERRAIN_TILE.buffer, {
        headers: { "Content-Type": "application/vnd.quantized-mesh" }
      });
    }
    // Unknown pattern — block
    return HttpResponse.error();
  })
);
