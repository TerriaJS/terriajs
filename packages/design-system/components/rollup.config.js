//@ts-check
import esbuild from "rollup-plugin-esbuild";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import { resolve, dirname, relative, join } from "node:path";
import { glob } from "glob";
import fs from "node:fs";

const tokensCss = "src/css/tokens.css";

/**
 * Custom PostCSS plugin that processes CSS files and preserves them next to components
 * @returns {import('rollup').Plugin}
 */
function postcssPlugin() {
  const processor = postcss([autoprefixer]);

  return {
    name: "postcss-preserve-modules",
    async resolveId(source, importer) {
      // Resolve CSS imports
      if (!source.endsWith(".css")) return null;

      const resolved = importer
        ? resolve(dirname(importer), source)
        : resolve(source);

      // Add to watch list
      this.addWatchFile(resolved);

      // Process and emit CSS
      const { readFile } = await import("fs/promises");
      const code = await readFile(resolved, "utf-8");

      const result = await processor.process(code, {
        from: resolved,
        to: resolved,
        map: true
      });

      // Calculate output path maintaining directory structure
      const relativePath = relative(join(process.cwd(), "src"), resolved);

      // Emit the processed CSS as an asset
      this.emitFile({
        type: "asset",
        fileName: relativePath,
        source: result.css
      });

      // Mark as external to preserve import
      return { id: source, external: true };
    }
  };
}

/**
 * Custom PostCSS plugin that copy the global CSS file to the dist folder
 * @returns {import('rollup').Plugin}
 */
const copyFiles = () => ({
  name: "copy-files",
  buildStart() {
    this.addWatchFile("src/css/layers.css");
    this.addWatchFile("src/css/reset.css");
    this.addWatchFile("src/css/base.css");
    this.addWatchFile("src/css/typography.css");
    this.addWatchFile("src/css/layout/index.css");
    this.addWatchFile("src/css/layout/flex.css");
    this.addWatchFile("src/css/layout/grid.css");
    this.addWatchFile("src/css/fonts.css");
    this.addWatchFile(tokensCss);
  },
  writeBundle() {
    fs.cpSync("src/css/layers.css", "dist/layers.css", { recursive: true });
    fs.cpSync("src/css/reset.css", "dist/reset.css", { recursive: true });
    fs.cpSync("src/css/base.css", "dist/base.css", { recursive: true });
    fs.cpSync("src/css/typography.css", "dist/typography.css", {
      recursive: true
    });
    // Its index imports the others by relative paths, so they're copied together
    fs.cpSync("src/css/layout", "dist/layout", {
      recursive: true,
      filter: (source) => !source.endsWith(".test.tsx")
    });
    fs.cpSync("src/css/fonts.css", "dist/fonts.css", { recursive: true });
    fs.cpSync(tokensCss, "dist/tokens.css", { recursive: true });
  }
});

// Find all index.ts files (main + all component indexes)
const inputFiles = glob.sync("src/**/index.ts");

// Everything the package declares stays an import, its subpaths too
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const declared = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies
});
/** @param {string} id */
const isDeclared = (id) =>
  declared.some((name) => id === name || id.startsWith(`${name}/`));

/** @type {import('rollup').RollupOptions} */
const config = {
  input: [...inputFiles],
  output: {
    dir: "dist",
    format: "es",
    preserveModules: true,
    preserveModulesRoot: "src",
    sourcemap: true
  },
  external: isDeclared,
  // Rollup leaves any import it can't resolve as one; an undeclared package
  // would then be missing for whoever installs this
  onwarn(warning, warn) {
    if (warning.code === "UNRESOLVED_IMPORT") {
      throw new Error(`${warning.message}: declare it in package.json`);
    }
    warn(warning);
  },
  plugins: [
    postcssPlugin(),
    esbuild({
      target: "es2022",
      jsx: "automatic",
      tsconfig: "./tsconfig.build.json"
    }),
    copyFiles()
  ],
  watch: {
    include: ["src/**"],
    exclude: "node_modules/**",
    clearScreen: false
  }
};

export default config;
