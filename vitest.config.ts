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
  const VIRTUAL_PREFIX = "\0scss-module:";

  const SASS_ALIASES: Record<string, string> = {
    "terriajs-variables": path.resolve(
      terriaJSBasePath,
      "lib/Sass/common/_default_variables.scss"
    )
  };

  function compileSassAndExtract(filePath: string): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sass = require("sass");
    const result = sass.compile(filePath, {
      loadPaths: [
        path.dirname(filePath),
        path.join(terriaJSBasePath, "lib"),
        terriaJSBasePath
      ],
      importers: [
        {
          findFileUrl(url: string) {
            if (SASS_ALIASES[url]) {
              return new URL("file://" + SASS_ALIASES[url]);
            }
            return null;
          }
        }
      ],
      silenceDeprecations: [
        "mixed-decls",
        "legacy-js-api",
        "color-functions",
        "import"
      ]
    });
    const css: string = result.css;
    const exports: Record<string, string> = {};

    // Extract :export block values (e.g. `mobile: 767;`)
    const exportBlockRe = /:export\s*\{([^}]+)\}/g;
    let exportMatch;
    while ((exportMatch = exportBlockRe.exec(css)) !== null) {
      const block = exportMatch[1];
      const propRe = /\s*([\w-]+)\s*:\s*([^;]+);/g;
      let propMatch;
      while ((propMatch = propRe.exec(block)) !== null) {
        const key = propMatch[1].replace(/-([a-z])/g, (_: string, c: string) =>
          c.toUpperCase()
        );
        exports[key] = propMatch[2].trim();
      }
    }

    // Extract CSS class names — identity-mapped for tests
    const classRe = /\.([\w-]+)\s*[{,]/g;
    let classMatch;
    while ((classMatch = classRe.exec(css)) !== null) {
      const raw = classMatch[1];
      const camel = raw.replace(/-([a-z])/g, (_: string, c: string) =>
        c.toUpperCase()
      );
      exports[camel] = raw;
      if (camel !== raw) {
        exports[raw] = raw;
      }
    }

    return `const styles = ${JSON.stringify(exports)};\nexport default styles;`;
  }

  return {
    name: "scss-as-modules",
    enforce: "pre",
    resolveId(source: string, importer: string | undefined) {
      if (
        source.endsWith(".scss") &&
        importer &&
        JS_EXTENSIONS.test(importer)
      ) {
        const resolved = path.resolve(path.dirname(importer), source);
        if (resolved.includes(path.join(terriaJSBasePath, "lib"))) {
          return { id: VIRTUAL_PREFIX + resolved + ".js", external: false };
        }
      }
    },
    load(id: string) {
      if (id.startsWith(VIRTUAL_PREFIX) && id.endsWith(".scss.js")) {
        const realPath = id.slice(VIRTUAL_PREFIX.length, -3);
        return compileSassAndExtract(realPath);
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
