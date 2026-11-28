import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { createRequire } from "module";
import * as path from "path";

const { name: packageName } = createRequire(import.meta.url)("./package.json");

const packagePath = path.resolve(".");

export default {
  input: "src/index.ts",
  output: {
    format: "esm",
    dir: "dist/",
    sourcemap: false
  },
  // preserveSymlinks is required to prevent rollup from expanding references to packages in yarn workspace to relative paths
  preserveSymlinks: true,
  external: (dep, _, isResolved) => {
    return isResolved
      ? !dep.startsWith(packagePath) // any source file that is not part of the package is external
      : !dep.startsWith(".") && !dep.startsWith("/"); // any bare imports must be external
  },
  plugins: [nodeResolve(), resolveSvgIcons(), typescript() /*terser()*/]
};

/**
 * Resolve `asset/icons/*.svg` imports and transform it to be picked up by the terriamap webpack loader.
 * See: "terriamap/buildprocess/configureWebpackForPlugins.js"
 */
function resolveSvgIcons() {
  return {
    name: "resolve-svg-icons",
    resolveId(importee) {
      // rewrite `assets/icons` path to absolute path
      return importee.startsWith(path.join("assets", "icons"))
        ? path.resolve("./", importee)
        : null;
    },
    transform(code, id) {
      // Transform icon asset files to require() the original svg file
      const isIconAsset =
        id.endsWith(".svg") &&
        path.relative(path.join("assets", "icons"), path.dirname(id)) === "";

      if (isIconAsset) {
        const relativeIconPath = path.relative(path.join("."), id);
        return {
          code: `export default require("${packageName}/${relativeIconPath}")`
        };
      } else {
        return null;
      }
    }
  };
}
