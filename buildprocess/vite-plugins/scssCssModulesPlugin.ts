import fs from "node:fs";

import type { Plugin } from "vite";

const VIRTUAL_EXT = ".module.scss";
const REAL_EXT = ".scss";

/**
 * Rewrites .scss imports from JS/TS files to .module.scss so Vite's CSS
 * Modules pipeline kicks in. The `load` hook reads the actual .scss file
 * when Vite requests the virtual .module.scss.
 *
 * SCSS-to-SCSS imports (@use, @import, @forward) are NOT intercepted — only
 * JS/TS → SCSS imports are rewritten.
 *
 * `composes: from` is handled by vite-css-modules which routes composed
 * dependencies through Vite's module graph for proper deduplication.
 */
export function scssCssModulesPlugin(): Plugin {
  return {
    name: "scss-css-modules",
    enforce: "pre",

    async resolveId(source, importer, options) {
      if (!source.endsWith(REAL_EXT)) return null;
      if (!importer || !/\.[jt]sx?$/.test(importer)) return null;

      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true
      });
      if (!resolved) return null;

      return resolved.id.replace(/\.scss$/, VIRTUAL_EXT);
    },

    load(id) {
      if (!id.endsWith(VIRTUAL_EXT)) return null;

      const realPath = id.slice(0, -VIRTUAL_EXT.length) + REAL_EXT;
      if (!fs.existsSync(realPath)) return null;

      return fs.readFileSync(realPath, "utf-8");
    }
  };
}
