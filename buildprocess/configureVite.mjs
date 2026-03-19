import fs from "node:fs";
import path from "node:path";

import babel from "@rolldown/plugin-babel";
import { patchCssModules } from "vite-css-modules";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { momentLocalePlugin } from "./vite-plugins/assetPlugins.mjs";
import { cesiumDebugStripPlugin } from "./vite-plugins/cesiumPlugin.mjs";
import { scssCssModulesPlugin } from "./vite-plugins/scssCssModulesPlugin.mjs";
import { svgSpritePlugin } from "./vite-plugins/svgSpritePlugin.mjs";

/**
 * @param {string} name
 * @param {string[]} searchPaths
 * @returns {string}
 */
function findPackageDir(name, searchPaths) {
  for (const base of searchPaths) {
    const candidate = path.join(base, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
  }
  throw new Error(
    `Could not find package "${name}" in: ${searchPaths.join(", ")}`
  );
}

/**
 * @param {{
 *   terriaJSBasePath: string;
 *   extraIconDirs?: { dir: string; namespace: string }[];
 *   terriaVariablesPath?: string;
 *   buildOutputPath?: string;
 * }} options
 * @returns {import("vite").UserConfig}
 */
export function configureVite(options) {
  const {
    terriaJSBasePath,
    extraIconDirs = [],
    terriaVariablesPath = path.resolve(
      terriaJSBasePath,
      "lib/Sass/common/_default_variables.scss"
    ),
    buildOutputPath = "."
  } = options;

  // Walk up from terriaJSBasePath to find node_modules (handles monorepo hoisting)
  const searchPaths = [];
  let dir = terriaJSBasePath;
  while (dir !== path.dirname(dir)) {
    searchPaths.push(dir);
    dir = path.dirname(dir);
  }

  const cesiumDir = findPackageDir("terriajs-cesium", searchPaths);
  const reactDir = findPackageDir("react", searchPaths);
  const reactDomDir = findPackageDir("react-dom", searchPaths);

  return {
    css: {
      modules: {
        localsConvention: "camelCase",
        generateScopedName(name, filename) {
          let basename = path.basename(filename, path.extname(filename));
          basename = basename.replace(/\.module$/, "");
          return `tjs-${basename}__${name}`;
        }
      },
      preprocessorOptions: {
        scss: {
          api: "modern",
          loadPaths: [
            path.resolve(terriaJSBasePath, "lib"),
            path.resolve(terriaJSBasePath, "lib", "Sass"),
            path.resolve(terriaJSBasePath, "node_modules"),
            terriaJSBasePath
          ]
        }
      }
    },

    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      alias: {
        "@cesium/engine": cesiumDir,
        "terriajs-variables": terriaVariablesPath,
        lodash: "lodash-es",
        react: reactDir,
        "react-dom": reactDomDir
      }
    },

    assetsInclude: ["**/*.pbf", "**/*.DAC"],

    plugins: [
      babel({
        exclude: /node_modules\/(?!terriajs\b)/,
        assumptions: { setPublicClassFields: false },
        presets: [
          {
            preset: () => ({
              presets: ["@babel/preset-typescript"],
              plugins: [
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-transform-class-properties"]
              ]
            }),
            rolldown: { filter: { code: "@" } }
          }
        ]
      }),
      viteStaticCopy({
        targets: [
          {
            src: path.join(
              findPackageDir("assimpjs", searchPaths),
              "dist",
              "assimpjs.wasm"
            ),
            dest: buildOutputPath
          },
          {
            src: path.join(cesiumDir, "Build", "Workers"),
            dest: `${buildOutputPath}/cesiumAssets`
          },
          {
            src: path.join(cesiumDir, "Source", "Assets"),
            dest: `${buildOutputPath}/cesiumAssets`
          },
          {
            src: path.join(cesiumDir, "Build", "ThirdParty"),
            dest: `${buildOutputPath}/cesiumAssets`
          }
        ]
      }),
      patchCssModules(),
      scssCssModulesPlugin(),
      svgSpritePlugin([
        {
          dir: path.resolve(terriaJSBasePath, "lib/icons"),
          namespace: "terriajs"
        },
        ...extraIconDirs
      ]),
      momentLocalePlugin(),
      cesiumDebugStripPlugin(cesiumDir)
    ]
  };
}
