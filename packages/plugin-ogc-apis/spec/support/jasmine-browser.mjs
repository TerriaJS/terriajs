import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// build/ — where webpack.config.specs.js emits the bundle and its assets.
const buildDir = path.resolve(__dirname, "../../build");

// Dev-only: auto-reload the browser tab when the bundle is rebuilt (set by the
// `dev` script). Left off for `test`/CI so `runSpecs` stays deterministic.
const liveReload = !!process.env.SPEC_LIVERELOAD;

const middleware = {};
if (liveReload) {
  // Expose the bundle's mtime so livereload.js can detect rebuilds.
  const bundlePath = path.join(buildDir, "plugin-ogc-apis-specs.js");
  middleware["/__build_id__"] = (_req, res) => {
    try {
      res.send(String(fs.statSync(bundlePath).mtimeMs));
    } catch {
      res.send("0");
    }
  };
}
// Serve the webpack-emitted assets (svg sprite, fonts, wasm, image URLs, ...)
// alongside the spec bundle.
middleware["/"] = express.static(buildDir, { index: false });

export default {
  srcDir: "build",
  srcFiles: [],
  specDir: "build",
  specFiles: ["plugin-ogc-apis-specs.js"],
  cssFiles: ["main.css"],
  helpers: liveReload ? ["livereload.js"] : [],

  env: {
    stopSpecOnExpectationFailure: false,
    stopOnSpecFailure: false,
    random: true,
    // Fail if a suite contains multiple suites or specs with the same name.
    forbidDuplicateNames: true
  },

  // For security, listen only to localhost. You can also specify a different
  // hostname or IP address, or remove the property or set it to "*" to listen
  // to all network interfaces.
  listenAddress: "localhost",

  // The hostname that the browser will use to connect to the server.
  hostname: "localhost",

  browser: {
    // Headless so `npm test` (runSpecs) doesn't pop a browser window.
    // `npm run dev` uses `serve`, which doesn't launch a browser — you open the
    // tab yourself.
    name: "headlessFirefox"
  },

  middleware
};
