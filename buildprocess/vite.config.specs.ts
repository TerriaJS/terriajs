import fs from "node:fs";
import path from "node:path";

import react from "@vitejs/plugin-react";
import glob from "fast-glob";
import { defineConfig, mergeConfig, type Plugin } from "vite";

import { configureVite } from "./configureVite.mjs";

const terriaJSBasePath = path.resolve(__dirname, "..");

/**
 * Treat .geojson and .czml files as JSON modules.
 * Rolldown doesn't support `with { type: "json" }` for non-.json extensions.
 */
function jsonExtensionsPlugin(): Plugin {
  return {
    name: "json-extensions",
    load(id) {
      if (id.endsWith(".geojson") || id.endsWith(".czml")) {
        const content = fs.readFileSync(id, "utf-8");
        return {
          code: `export default ${content};`,
          map: null
        };
      }
    }
  };
}

/**
 * Virtual entry that imports all spec files so Rollup produces a single output.
 * The glob runs at load time so `--watch` picks up new test files on rebuild.
 */
function specsEntryPlugin(): Plugin {
  const ID = "\0specs-entry";
  return {
    name: "specs-entry",
    resolveId: (id) => (id === ID ? ID : undefined),
    load(id) {
      if (id !== ID) return;
      const files = glob.sync(
        [
          "test/SpecMain.ts",
          "test/**/*Spec.ts",
          "test/**/*Spec.tsx",
          "test/Models/Experiment.ts"
        ],
        { cwd: terriaJSBasePath }
      );
      return files.map((f) => `import "./${f}";`).join("\n");
    }
  };
}

const shared = configureVite({ terriaJSBasePath });

export default defineConfig(({ mode }) => {
  const devMode = mode !== "production";

  return mergeConfig(shared, {
    root: terriaJSBasePath,
    publicDir: "assets",

    define: {
      "process.env.NODE_ENV": JSON.stringify(
        devMode ? "development" : "production"
      )
    },

    build: {
      outDir: "wwwroot/build",
      emptyOutDir: false,
      sourcemap: devMode ? "inline" : "hidden",
      minify: false,
      rollupOptions: {
        input: "\0specs-entry",
        output: {
          format: "iife",
          entryFileNames: "TerriaJS-specs.js"
        },
        treeshake: false
      }
    },

    plugins: [
      jsonExtensionsPlugin(),
      specsEntryPlugin(),
      react({
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/transform-class-properties"],
            "babel-plugin-styled-components"
          ],
          assumptions: {
            setPublicClassFields: false
          }
        }
      })
    ]
  });
});
