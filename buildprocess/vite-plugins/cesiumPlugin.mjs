/**
 * Strip Cesium debug pragmas in production builds.
 * Removes code between //>>includeStart('debug') and //>>includeEnd('debug').
 *
 * @param {string} cesiumDir
 * @returns {import("vite").Plugin}
 */
export function cesiumDebugStripPlugin(cesiumDir) {
  const pragmaRegex =
    /\/\/>>includeStart\('debug', pragmas\.debug\);?[^]*?\/\/>>includeEnd\('debug'\);?/g;

  return {
    name: "cesium-strip-debug",
    apply: "build",
    transform(code, id) {
      if (!id.endsWith(".js") || !id.includes(cesiumDir)) return;
      return { code: code.replace(pragmaRegex, ""), map: null };
    }
  };
}
