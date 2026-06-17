// Minimal valid quantized-mesh terrain tile.
// Serves as a no-op terrain response so Cesium terrain loading succeeds
// without making real API calls.
export const TERRAIN_TILE = Uint8Array.from(
  atob(
    "DyjONRkhR8H/8xPXCNZJQR9p84sdA1HBpI68wezRtsEPKA41GSFHwf/z0+n61UlBH2ljoAQDUcFS" +
      "2+dvmXHnQOYvRP25a96/3gsHMY794D9PNmgpVnPmvxEAAAAAAJCAtz/XQEbAuD/9/5CAtz9uf7g/" +
      "AABtf4+AAAD+/wAAAAAAADpBAAAAADlB8IAAALg/AAC3P7U/xL4AAFU/Vj9VPxxZPlSzQ9UsjIGi" +
      "QSfZolxtO9hXhDKmFGeAo2ZWFH6YQBMUAAAAAAAAAAAAAwABAAAAAAADAAQAAQAEAAAABAAAAAQAA" +
      "AAGAAQAAgAGAAAAAQAHAAIAAgAFAAAAAQAGAAAABwAGAAAAAgAIAAEAAAAGAAQABgABAAUABQAAAA" +
      "AAAwACAAcACQAHAAEAAAAEAAcABwAGAAAAAgAIAAEABQAAAAAADQAOAAYAAwADAAAAAAAFAAEABQAA" +
      "AAUADwAQAAoACwADAAAADQAPAAwAASIAAAAp3CjcKtwp3CncKNwp3CrcKtwq2yjbKNsp2yncKdwp" +
      "2yjbAgEAAAD/BFYAAABSAAAAeyJnZW9tZXRyaWNlcnJvciI6MzAuNzEwOTQyMjgyMTk5NjA3LC" +
      "JsZWFmIjp0cnVlLCJzdXJmYWNlYXJlYSI6NDM1ODA1Mjk1Mi42MDM5OTE1fQ=="
  ),
  (c) => c.charCodeAt(0)
);

// Minimal layer.json for CesiumTerrainProvider — zoom 0 only, two tiles.
export const LAYER_JSON = {
  tilejson: "2.1.0",
  format: "quantized-mesh-1.0",
  version: "1.2.0",
  scheme: "tms",
  tiles: ["{z}/{x}/{y}.terrain"],
  minzoom: 0,
  maxzoom: 0,
  bounds: [-180, -90, 180, 90],
  available: [[{ startX: 0, startY: 0, endX: 1, endY: 0 }]]
};
