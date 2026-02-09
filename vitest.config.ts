import { defineConfig, type Plugin } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { readFileSync } from "node:fs";

const cesiumDir = path.dirname(require.resolve("terriajs-cesium/package.json"));
const terriaJSBasePath = path.resolve(__dirname);

function xmlRawPlugin(): Plugin {
  return {
    name: "xml-raw-import",
    transform(_code: string, id: string) {
      if (id.endsWith(".xml") && id.includes(path.join("lib", "Models"))) {
        const content = readFileSync(id, "utf-8");
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null
        };
      }
    }
  };
}

function svgSpritePlugin(): Plugin {
  return {
    name: "svg-sprite-stub",
    transform(_code: string, id: string) {
      if (
        id.endsWith(".svg") &&
        id.includes(path.join("wwwroot", "images", "icons"))
      ) {
        const name = path.basename(id, ".svg");
        return {
          code: `export default "terriajs_${name}";`,
          map: null
        };
      }
    }
  };
}

function scssModulesPlugin(): Plugin {
  const JS_EXTENSIONS = /\.(ts|tsx|js|jsx)$/;
  const virtualToReal = new Map<string, string>();
  return {
    name: "scss-as-modules",
    enforce: "pre",
    resolveId(source: string, importer: string | undefined) {
      if (
        source.endsWith(".scss") &&
        importer &&
        !source.includes(".module.") &&
        JS_EXTENSIONS.test(importer)
      ) {
        const resolved = path.resolve(path.dirname(importer), source);
        if (resolved.includes(path.join(terriaJSBasePath, "lib"))) {
          const virtualId = resolved.replace(/\.scss$/, ".module.scss");
          virtualToReal.set(virtualId, resolved);
          return { id: virtualId, external: false };
        }
      }
    },
    load(id: string) {
      const realPath = virtualToReal.get(id);
      if (realPath) {
        return readFileSync(realPath, "utf-8");
      }
    }
  };
}

function csvRawPlugin(): Plugin {
  return {
    name: "csv-raw-import",
    transform(_code: string, id: string) {
      if (
        (id.endsWith(".csv") || id.endsWith(".xml")) &&
        id.includes(path.join("wwwroot", "test"))
      ) {
        const content = readFileSync(id, "utf-8");
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null
        };
      }
    }
  };
}

export default defineConfig({
  plugins: [
    scssModulesPlugin(),
    xmlRawPlugin(),
    svgSpritePlugin(),
    csvRawPlugin()
  ],
  resolve: {
    alias: {
      "@cesium/engine": cesiumDir,
      lodash: "lodash-es",
      "terriajs-variables": path.resolve(
        terriaJSBasePath,
        "lib/Sass/common/_default_variables.scss"
      )
    },
    extensions: [".js", ".ts", ".tsx", ".jsx"]
  },
  css: {
    modules: {
      localsConvention: "camelCase"
    }
  },
  assetsInclude: ["**/*.DAC"],
  server: {
    fs: {
      allow: [terriaJSBasePath]
    }
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
