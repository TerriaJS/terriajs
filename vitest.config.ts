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
        const symbolId = `terriajs-${name}`;
        return {
          code: `export default { id: "${symbolId}", viewBox: "0 0 100 100", content: "" };`,
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
    // Match any .className pattern (handles compound selectors like .foo.bar, .foo:pseudo)
    const classRe = /\.([a-zA-Z_][\w-]*)/g;
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

function webpackLoaderSyntaxPlugin(): Plugin {
  return {
    name: "strip-webpack-loader-syntax",
    enforce: "pre",
    resolveId(source: string, importer: string | undefined) {
      // Strip webpack inline loader prefixes like "!!style-loader!css-loader!./file.css"
      // or "worker-loader!./downloadHrefWorker"
      const match = source.match(/^(?:!{1,2})?(?:[\w-]+!)+(.+)$/);
      if (match) {
        const stripped = match[1];
        if (
          importer &&
          (stripped.startsWith("./") || stripped.startsWith("../"))
        ) {
          return path.resolve(path.dirname(importer), stripped);
        }
        return stripped;
      }
    }
  };
}

function wasmPlugin(): Plugin {
  return {
    name: "wasm-mime-type",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith("assimpjs.wasm")) {
          const wasmPath = require.resolve("assimpjs/dist/assimpjs.wasm");
          res.setHeader("Content-Type", "application/wasm");
          res.end(readFileSync(wasmPath));
          return;
        }
        next();
      });
    }
  };
}

function cesiumAssetsPlugin(): Plugin {
  return {
    name: "cesium-assets-serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const marker = "/build/Cesium/build/";
        if (req.url && req.url.includes(marker)) {
          const assetPath = req.url.split(marker)[1];
          req.url = `/@fs/${path.join(cesiumDir, "Source", assetPath)}`;
        }
        next();
      });
    }
  };
}

function pbfPlugin(): Plugin {
  return {
    name: "pbf-as-arraybuffer",
    transform(_code: string, id: string) {
      if (id.endsWith(".pbf")) {
        const base64 = readFileSync(id).toString("base64");
        return {
          code: [
            `const b = atob("${base64}");`,
            `const u = new Uint8Array(b.length);`,
            `for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);`,
            `export default u.buffer;`
          ].join("\n"),
          map: null
        };
      }
    }
  };
}

function geojsonPlugin(): Plugin {
  return {
    name: "geojson-as-json",
    transform(_code: string, id: string) {
      if (id.endsWith(".geojson")) {
        const content = readFileSync(id, "utf-8");
        return {
          code: `export default ${content};`,
          map: null
        };
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
    webpackLoaderSyntaxPlugin(),
    scssModulesPlugin(),
    xmlRawPlugin(),
    svgSpritePlugin(),
    csvRawPlugin(),
    pbfPlugin(),
    geojsonPlugin(),
    cesiumAssetsPlugin(),
    wasmPlugin()
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
  esbuild: {
    loader: "tsx",
    include: /\.[jt]sx?$/
  },
  publicDir: "wwwroot",
  assetsInclude: ["**/*.DAC"],
  server: {
    fs: {
      allow: [terriaJSBasePath, cesiumDir]
    }
  },
  test: {
    globals: true,
    include: ["test/**/*Spec.{ts,tsx}"],
    exclude: ["test/Types/**", "test/ModelMixins/MinMaxLevelMixinSpec.ts"],
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
