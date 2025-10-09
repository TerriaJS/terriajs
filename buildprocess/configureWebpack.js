const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const ForkTsCheckerNotifierWebpackPlugin = require("fork-ts-checker-notifier-webpack-plugin");
const webpack = require("webpack");
const SvgSpriteWebpackPlugin = require("./svgs/SvgSpriteWebpackPlugin.js");
const defaultBabelLoader = require("./defaultBabelLoader");

/**
 * Supplements the given webpack config with options required to build TerriaJS
 *
 * @param [options.terriaJSBasePath] The TerriaJS source directory
 * @param [options.config] Base webpack configuration
 * @param [options.devMode] Set to `true` to generate for development build, default is `false`.
 * @param [options.MiniCssExtractPlugin]
 * @param [options.babelLoader] Optional babelLoader config, defaults to ./defaultBabelLoader.js
 */
function configureWebpack({
  terriaJSBasePath,
  config,
  devMode,
  MiniCssExtractPlugin,
  babelLoader
}) {
  const cesiumDir = path.dirname(
    require.resolve("terriajs-cesium/package.json")
  );

  config.node = config.node || {};
  config.resolve = config.resolve || {};

  // Use empty polyfills for nodejs modules
  config.resolve.fallback = {
    fs: false, // assimp
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

  babelLoader = babelLoader || defaultBabelLoader({ devMode });
  // Use Babel to compile our JavaScript and TypeScript files.
  config.module.rules.push({
    test: /\.(ts|js)x?$/,
    include: [
      path.resolve(terriaJSBasePath, "node_modules", "commander"),
      path.resolve(terriaJSBasePath, "lib"),
      path.resolve(terriaJSBasePath, "test"),
      path.resolve(terriaJSBasePath, "buildprocess", "generateDocs.ts"),
      path.resolve(terriaJSBasePath, "buildprocess", "generateCatalogIndex.ts"),
      path.resolve(terriaJSBasePath, "buildprocess", "patchNetworkRequests.ts")
    ],
    use: [babelLoader]
  });

  // Allow XML in the Models directory to be required-in as raw text.
  config.module.rules.push({
    test: /\.xml$/,
    include: path.resolve(terriaJSBasePath, "lib", "Models"),
    type: "asset/source" // inlines xml as raw text
  });

  // Allow .DAC file to be imported from MouseCoords.ts as URL
  config.module.rules.push({
    test: /\.(DAC)$/i,
    type: "asset/resource",
    include: [path.resolve(terriaJSBasePath, "wwwroot", "data")]
  });

  // Allow import of .css files from tinymce package
  config.module.rules.push({
    test: /\.(css)$/i,
    type: "asset/source",
    include: [path.dirname(require.resolve("tinymce/package.json"))]
  });

  // Remove Cesium debug mode checks in production. This might slightly improve performance.
  // TODO: It will be good to have it enabled in devMode though, to discover issues with code
  // however doing so currently breaks a few specs.
  config.module.rules.push({
    test: /\.js$/,
    include: path.resolve(cesiumDir, "Source"),
    use: [babelLoader, require.resolve("./removeCesiumDebugPragmas")]
  });

  // Handle SVG icons with sprite loader
  config.module.rules.push({
    test: /\.svg$/,
    include: [path.resolve(terriaJSBasePath, "wwwroot", "images", "icons")],
    loader: path.resolve(__dirname, "svgs", "svg-sprite-loader.js"),
    options: {
      namespace: "terriajs"
    }
  });

  // handle other image imports
  config.module.rules.push({
    test: /\.(png|jpg|svg|gif)$/,
    include: [
      path.resolve(terriaJSBasePath) + path.sep,
      path.resolve(cesiumDir)
    ],
    exclude: [path.resolve(terriaJSBasePath, "wwwroot", "images", "icons")],
    type: "asset" // inlines if file size < 8KB
  });

  config.plugins = config.plugins || [];

  // Add SVG Sprite Webpack Plugin
  config.plugins.push(new SvgSpriteWebpackPlugin());

  // Do not import momentjs locale files
  // Saves ~500kb (unzipped)
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  );

  // Copy assimpjs.wasm file - this is used by AssImpCatalogItem (see AssImpCatalogItem.forceLoadMapItems())
  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: require.resolve("assimpjs/dist/assimpjs.wasm"),
          to: "assimpjs.wasm"
        }
      ]
    })
  );

  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"]
    })
  );

  // Define NODE_ENV from mode setting - used in a few places in Terria
  config.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        devMode ? "development" : "production"
      )
    })
  );

  // Fork TypeScript type checking to a separate thread
  config.plugins.push(
    new ForkTsCheckerWebpackPlugin({
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
  if (MiniCssExtractPlugin) {
    config.module.rules.push({
      exclude: [
        path.resolve(terriaJSBasePath, "lib", "Sass", "common"),
        path.resolve(terriaJSBasePath, "lib", "Sass", "global")
      ],
      include: path.resolve(terriaJSBasePath, "lib"),
      test: /\.scss$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
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
            api: "modern",
            sassOptions: {
              sourceMap: true
            }
          }
        }
      ]
    });
  }

  // Alias react and react-dom to the one used by the building folder - apparently we can rely on the dir always being
  // called node_modules https://github.com/npm/npm/issues/2734
  config.resolve.alias["react"] = path.dirname(require.resolve("react"));
  config.resolve.alias["react-dom"] = path.dirname(
    require.resolve("react-dom")
  );

  // Make a terriajs-variables alias so it's really easy to override our sass variables by aliasing over the top of this.
  config.resolve.alias["terriajs-variables"] =
    config.resolve.alias["terriajs-variables"] ||
    require.resolve("../lib/Sass/common/_default_variables.scss");

  // Alias all lodash imports (including from our dependencies) to lodash-es
  // This saves close to ~600KB unzipped
  // Maybe we can remove this when lodash 5 comes out (?)
  config.resolve.alias["lodash"] = "lodash-es";

  return config;
}

module.exports = configureWebpack;
