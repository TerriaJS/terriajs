import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";

const require = createRequire(import.meta.url);

// What buildprocess/configureWebpack.js does for the models' own files, so
// lib/UI tests can build a real Terria: XML and KML templates are inlined as
// text (webpack's asset/source)
const inlineText = (): Plugin => ({
  name: "terriajs-inline-text",
  enforce: "pre",
  transform(code, id) {
    if (!/\.(xml|kml)$/i.test(id)) return null;
    return { code: `export default ${JSON.stringify(code)};`, map: null };
  }
});

// A real Terria's imports reach the current UI's views, built by webpack. Their
// Sass and webpack's inline-loader imports are stubbed: the new UI never loads
// the current UI's styles, and they need webpack's Sass setup. A stubbed CSS
// module gives back the class names it's asked for
const OLD_STYLES = "\0terriajs-old-styles";
const OLD_WORKER = "\0terriajs-old-worker";
const stubCurrentUi = (): Plugin => ({
  name: "terriajs-stub-current-ui",
  enforce: "pre",
  resolveId(source) {
    if (/\.scss$/i.test(source) || source.startsWith("!!style-loader!")) {
      return OLD_STYLES;
    }
    if (source.startsWith("worker-loader!")) return OLD_WORKER;
    return null;
  },
  load(id) {
    if (id === OLD_STYLES) {
      return "export default new Proxy({}, { get: (_, name) => (typeof name === 'string' ? name : undefined) });";
    }
    if (id === OLD_WORKER) return "export default class {}";
    return null;
  }
});

// The new UI's tests (lib/UI). The rest of TerriaJS is tested with Jasmine
// (gulp test) until it moves here too
export default defineConfig({
  plugins: [react(), inlineText(), stubCurrentUi()],
  assetsInclude: ["**/*.DAC"],
  resolve: {
    alias: {
      "@cesium/engine": path.dirname(
        require.resolve("terriajs-cesium/package.json")
      ),
      lodash: "lodash-es"
    }
  },
  test: {
    include: ["lib/UI/**/*.test.{ts,tsx}"],
    setupFiles: ["lib/UI/test/setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }]
    }
  }
});
