import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { createReadStream, existsSync } from "node:fs";
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

// Cesium's workers, assets and third-party files, where the build copies them
// for the app (gulpfile.js, build/Cesium/build), served at /cesium/ for the
// test Terria's cesiumBaseUrl. Without its workers the 3D globe draws nothing
const CESIUM_ROOT = path.dirname(
  require.resolve("terriajs-cesium/package.json")
);
const CESIUM_FOLDERS: Record<string, string> = {
  Workers: "Build/Workers",
  ThirdParty: "Source/ThirdParty",
  Assets: "Source/Assets"
};
const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".xml": "application/xml"
};
const serveCesium = (): Plugin => ({
  name: "terriajs-serve-cesium",
  configureServer(server) {
    server.middlewares.use("/cesium", (request, response, next) => {
      const [folder, ...rest] = (request.url ?? "")
        .split("?")[0]
        .split("/")
        .filter(Boolean);
      const base = CESIUM_FOLDERS[folder];
      if (!base) return next();
      const root = path.join(CESIUM_ROOT, base);
      const file = path.join(root, ...rest.map(decodeURIComponent));
      if (!file.startsWith(root + path.sep) || !existsSync(file)) return next();
      response.setHeader(
        "Content-Type",
        CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream"
      );
      createReadStream(file).pipe(response);
    });
  }
});

// MSW's service worker, from the installed package so it matches the msw the
// tests import, served where lib/UI/test/network.ts registers it
const serveMockServiceWorker = (): Plugin => ({
  name: "terriajs-serve-mock-service-worker",
  configureServer(server) {
    server.middlewares.use("/mockServiceWorker.js", (_request, response) => {
      response.setHeader("Content-Type", "text/javascript");
      createReadStream(require.resolve("msw/mockServiceWorker.js")).pipe(
        response
      );
    });
  }
});

// The new UI's tests (lib/UI). The rest of TerriaJS is tested with Jasmine
// (gulp test) until it moves here too
export default defineConfig({
  plugins: [
    react(),
    inlineText(),
    stubCurrentUi(),
    serveCesium(),
    serveMockServiceWorker()
  ],
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
      // A desktop window: the new UI has no small-screen layout yet
      viewport: { width: 1280, height: 800 },
      instances: [{ browser: "chromium" }]
    }
  }
});
