import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import type { UserConfig } from "vite";
import { patchCssModules } from "vite-css-modules";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { momentLocalePlugin } from "./vite-plugins/assetPlugins.ts";
import { cesiumDebugStripPlugin } from "./vite-plugins/cesiumPlugin.ts";
import { scssCssModulesPlugin } from "./vite-plugins/scssCssModulesPlugin.ts";
import { svgSpritePlugin } from "./vite-plugins/svgSpritePlugin.ts";

const require = createRequire(import.meta.url);

interface ConfigureViteOptions {
  terriaJSBasePath: string;
  extraIconDirs?: Array<{ dir: string; namespace: string }>;
  terriaVariablesPath?: string;
  buildOutputPath?: string;
}

function findPackageDir(name: string, searchPaths: string[]): string {
  for (const base of searchPaths) {
    const candidate = path.join(base, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
  }
  throw new Error(
    `Could not find package "${name}" in: ${searchPaths.join(", ")}`
  );
}

export function configureVite(options: ConfigureViteOptions): UserConfig {
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
  const searchPaths: string[] = [];
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
        generateScopedName(name: string, filename: string) {
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
      viteStaticCopy({
        targets: [
          {
            src: require.resolve("assimpjs/dist/assimpjs.wasm"),
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
