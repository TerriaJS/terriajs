// @ts-check

"use strict";

const path = require("path");
const { TsCheckerRspackPlugin } = require("ts-checker-rspack-plugin");
const ForkTsCheckerNotifierWebpackPlugin = require("fork-ts-checker-notifier-webpack-plugin");
const { rspack } = require("@rspack/core");

/**
 * Supplements the given Rspack config with options required to build TerriaJS
 *
 * @param [options.terriaJSBasePath] The TerriaJS source directory
 * @param [options.config] Base webpack configuration
 * @param [options.devMode] Set to `true` to generate for development build, default is `false`.
 * @param [options.CssExtractRspackPlugin]
 */
function configureRspack({
  terriaJSBasePath,
  config,
  devMode,
  CssExtractRspackPlugin
}) {
  const cesiumDir = path.dirname(
    require.resolve("terriajs-cesium/package.json")
  );

  config.node = config.node || {};
  config.resolve = config.resolve || {};

  // Use empty polyfills for nodejs modules
  config.resolve.fallback = {
    fs: false, // geojson-merge, assimp
    stream: false, // geojson-merge -> geojson-stream
    crypto: false, // assismp.js
    path: false // assimp.js
  };

  config.resolve.extensions = config.resolve.extensions || [
    ".js",
    ".ts",
    ".tsx",
    ".jsx"
  ];

  config.resolve.alias = {
    // @cesium/widgets will import from @cesium/engine. We need to make sure it ends up with
    // the terriajs-cesium fork instead of upstream cesium.
    "@cesium/engine": path.resolve(
      require.resolve("terriajs-cesium/package.json"),
      ".."
    ),
    ...config.resolve.alias
  };
  config.resolve.modules = config.resolve.modules || [];
  config.resolve.modules.push(path.resolve(terriaJSBasePath, "wwwroot"));

  config.module = config.module || {};
  config.module.rules = config.module.rules || [];

  // Use SWC to compile our JavaScript and TypeScript files.
  config.module.rules.push({
    test: /\.[jt]sx?$/,
    include: [
      path.resolve(terriaJSBasePath, "node_modules", "commander"),
      path.resolve(terriaJSBasePath, "lib"),
      path.resolve(terriaJSBasePath, "test"),
      path.resolve(terriaJSBasePath, "buildprocess", "generateDocs.ts"),
      path.resolve(terriaJSBasePath, "buildprocess", "generateCatalogIndex.ts"),
      path.resolve(terriaJSBasePath, "buildprocess", "patchNetworkRequests.ts"),
      path.resolve(cesiumDir, "Source")
    ],
    exclude: [/[\\/]node_modules[\\/]/],
    loader: "builtin:swc-loader",
    /** @type {import('@rspack/core').SwcLoaderOptions} */
    options: {
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
          tsx: true
        },
        externalHelpers: true,
        transform: {
          // For MobX, see https://mobx.js.org/enabling-decorators.html
          legacyDecorator: true,
          react: {
            runtime: "automatic",
            development: devMode,
            // FIXME: setting refresh to devMode fails the tests with:
            // ReferenceError: $RefreshReg$ is not defined
            refresh: false
          }
        }
      },
      env: {
        coreJs: "3",
        mode: "usage",
        targets: ["since 2020-01-01 and not dead"]
      }
    },
    type: "javascript/auto"
  });

  // Allow XML in the Models directory to be required-in as raw text.
  config.module.rules.push({
    test: /\.xml$/,
    include: path.resolve(terriaJSBasePath, "lib", "Models"),
    type: "asset/source" // inlines xml as raw text
  });

  // Allow .DAC file to be imported from MouseCoords.ts as URL
  config.module.rules.push({
    test: /\.DAC$/i,
    type: "asset/resource",
    include: [path.resolve(terriaJSBasePath, "wwwroot", "data")]
  });

  // Allow import of .css files from tinymce package
  config.module.rules.push({
    test: /\.css$/i,
    type: "asset/source",
    include: [path.dirname(require.resolve("tinymce/package.json"))]
  });

  // Remove Cesium debug mode checks in production. This might slightly improve performance.
  // TODO: It will be good to have it enabled in devMode though, to discover issues with code
  // however doing so currently breaks a few specs.
  /*
  FIXME: enabling this makes all the Cesium tests fail on supportsWebGL.
  config.module.rules.push({
    test: /\.js$/,
    include: path.resolve(cesiumDir, "Source"),
    use: ["builtin:swc-loader", require.resolve("./removeCesiumDebugPragmas")]
  });
 */
  // handle image imports
  config.module.rules.push({
    test: /\.(png|jpg|svg|gif)$/,
    include: [
      path.resolve(terriaJSBasePath) + path.sep,
      path.resolve(cesiumDir)
    ],
    exclude: [path.resolve(terriaJSBasePath, "wwwroot", "images", "icons")],
    type: "asset" // inlines if file size < 8KB
  });

  // Convert imported svg icons into a sprite
  // TODO: svg-sprite-loader has several security warnings - we need to find an alternative
  config.module.rules.push({
    test: /\.svg$/,
    include: path.resolve(terriaJSBasePath, "wwwroot", "images", "icons"),
    loader: require.resolve("svg-sprite-loader"),
    options: {
      esModule: false
    }
  });

  config.devServer = config.devServer || {
    port: 3003,
    open: true,
    contentBase: "wwwroot/",
    proxy: {
      "*": {
        target: "http://localhost:3001",
        bypass: function (
          /** @type {any} */ req,
          /** @type {any} */ res,
          /** @type {any} */ proxyOptions
        ) {
          if (
            req.url.indexOf("/proxy") < 0 &&
            req.url.indexOf("/proj4lookup") < 0 &&
            req.url.indexOf("/convert") < 0 &&
            req.url.indexOf("/proxyabledomains") < 0 &&
            req.url.indexOf("/errorpage") < 0 &&
            req.url.indexOf("/init") < 0 &&
            req.url.indexOf("/serverconfig") < 0
          ) {
            return req.originalUrl;
          }
        }
      }
    }
  };

  config.plugins = config.plugins || [];

  // Do not import momentjs locale files
  // Saves ~500kb (unzipped)
  config.plugins.push(
    new rspack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  );

  // Copy assimpjs.wasm file - this is used by AssImpCatalogItem (see AssImpCatalogItem.forceLoadMapItems())
  config.plugins.push(
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: require.resolve("assimpjs/dist/assimpjs.wasm"),
          to: "assimpjs.wasm"
        }
      ]
    })
  );

  // Handle reference to Buffer in geojson-merge
  config.plugins.push(
    new rspack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    })
  );

  // Define NODE_ENV from mode setting - used in a few places in Terria
  config.plugins.push(
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        devMode ? "development" : "production"
      )
    })
  );

  // Fork TypeScript type checking to a separate thread
  config.plugins.push(
    new TsCheckerRspackPlugin({
      typescript: {
        memoryLimit: 4096,
        configFile: path.resolve(__dirname, "..", "tsconfig.json"),
        diagnosticOptions: {
          semantic: true,
          syntactic: true
        }
      }
    })
  );

  config.plugins.push(
    new ForkTsCheckerNotifierWebpackPlugin({
      excludeWarnings: true,
      // probably don't need to know first check worked as well - disable it
      skipFirstNotification: true
    })
  );

  // Sass settings
  if (CssExtractRspackPlugin) {
    config.module.rules.push({
      exclude: [
        path.resolve(terriaJSBasePath, "lib", "Sass", "common"),
        path.resolve(terriaJSBasePath, "lib", "Sass", "global")
      ],
      include: path.resolve(terriaJSBasePath, "lib"),
      test: /\.scss$/,
      use: [
        {
          loader: CssExtractRspackPlugin.loader,
          options: { defaultExport: true }
        },
        { loader: "terriajs-typings-for-css-modules-loader" },
        {
          loader: require.resolve("css-loader"),
          options: {
            sourceMap: true,
            modules: {
              localIdentName: "tjs-[name]__[local]",
              exportLocalsConvention: "camelCase"
            },
            importLoaders: 2
          }
        },
        { loader: "resolve-url-loader", options: { sourceMap: true } },
        {
          loader: "sass-loader",
          options: {
            // TODO: Should improve build performance:
            // api: 'modern-compiler',
            // implementation: require.resolve('sass-embedded'),
            api: "modern",
            implementation: require.resolve("sass"),
            sassOptions: {
              sourceMap: true
            }
          }
        }
      ],
      type: "javascript/auto"
    });
  }

  // Alias react and react-dom to the one used by the building folder - apparently we can rely on the dir always being
  // called node_modules https://github.com/npm/npm/issues/2734
  config.resolve.alias["react"] = path.dirname(require.resolve("react"));
  config.resolve.alias["react-dom"] = path.dirname(
    require.resolve("react-dom")
  );

  // Alias all lodash imports (including from our dependencies) to lodash-es
  // This saves close to ~600KB unzipped
  // Maybe we can remove this when lodash 5 comes out (?)
  config.resolve.alias["lodash"] = "lodash-es";

  return config;
}

module.exports = configureRspack;
