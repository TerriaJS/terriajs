import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vite";

import { configureVite } from "./configureVite.ts";

const terriaJSBasePath = path.resolve(__dirname, "..");

const shared = configureVite({ terriaJSBasePath });

export default defineConfig(() =>
  mergeConfig(shared, {
    root: terriaJSBasePath,
    publicDir: false,

    build: {
      outDir: "build",
      ssr: true,
      target: "node20",
      sourcemap: true,
      minify: false,
      rollupOptions: {
        input: {
          generateDocs: path.resolve(__dirname, "generateDocs.ts"),
          generateCatalogIndex: path.resolve(
            __dirname,
            "generateCatalogIndex.ts"
          )
        },
        output: {
          format: "esm",
          entryFileNames: "[name].js"
        },
        external: [/^node:/, "canvas", "vue", "fsevents"]
      }
    },

    plugins: [
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
  })
);
