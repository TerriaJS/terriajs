import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";

const cesiumDir = path.dirname(require.resolve("terriajs-cesium/package.json"));

export default defineConfig({
  publicDir: "wwwroot",
  resolve: {
    alias: {
      "@cesium/engine": cesiumDir,
      lodash: "lodash-es",
      "terriajs-variables": path.resolve(
        __dirname,
        "lib/Sass/common/_default_variables.scss"
      )
    },
    extensions: [".js", ".ts", ".tsx", ".jsx"]
  },
  test: {
    globals: true,
    include: ["test/**/*Spec.{ts,tsx,js,jsx}"],
    exclude: [],
    setupFiles: ["test/setup.ts"],
    testTimeout: 60_000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "firefox" }]
    }
  }
});
