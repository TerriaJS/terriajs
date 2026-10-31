/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Webpack config for building this plugin's browser specs.
 *
 * Unlike the production `rollup.config.ts` (which externalises terriajs and is
 * consumed by terriamap's webpack), the specs must run standalone in a browser.
 * We therefore bundle everything by reusing terriajs's own `configureWebpack`,
 * which already knows how to compile terriajs/cesium source (ts/tsx/jsx, scss,
 * svg icons, web workers, ...). The single classic-script bundle it produces is
 * served to jasmine-browser-runner (see spec/support/jasmine-browser.mjs).
 */
const path = require("path");
const glob = require("fast-glob");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const configureWebpack = require("terriajs/buildprocess/configureWebpack");
const defaultBabelLoader = require("terriajs/buildprocess/defaultBabelLoader");

const pluginBasePath = path.resolve(__dirname, "..");
const terriaJSBasePath = path.dirname(require.resolve("terriajs/package.json"));

// SpecMain.ts must run first (it starts the MSW worker), followed by the specs.
const specFiles = [
  path.resolve(pluginBasePath, "spec", "SpecMain.ts"),
  ...glob.sync(["spec/**/*Spec.ts", "spec/**/*Spec.tsx"], {
    cwd: pluginBasePath,
    absolute: true
  })
];

function makeConfig(devMode) {
  const config = {
    mode: devMode ? "development" : "production",
    entry: specFiles,
    output: {
      path: path.resolve(pluginBasePath, "build"),
      filename: "plugin-ogc-apis-specs.js",
      // Assets are served from the same dir the bundle is loaded from (see
      // spec/support/jasmine-browser.mjs middleware), so resolve URLs relative
      // to the bundle.
      publicPath: "auto"
    },
    devtool: devMode ? "eval-cheap-module-source-map" : "source-map",
    resolve: {
      alias: {},
      modules: ["node_modules"]
    },
    plugins: [
      new MiniCssExtractPlugin({ ignoreOrder: true }),
      // Serve MSW's service worker script at the root so worker.start() can
      // register it (see spec/SpecMain.ts).
      new CopyPlugin({
        patterns: [
          {
            from: require.resolve("msw/mockServiceWorker.js"),
            to: "mockServiceWorker.js"
          },
          // Dev-only live-reload helper (activated via SPEC_LIVERELOAD in the
          // jasmine config); harmless to ship into build/ when unused.
          {
            from: path.resolve(
              pluginBasePath,
              "spec",
              "support",
              "livereload.js"
            ),
            to: "livereload.js"
          }
        ]
      })
    ],
    module: { rules: [] }
  };

  const configured = configureWebpack({
    terriaJSBasePath,
    config,
    devMode,
    MiniCssExtractPlugin
  });

  // configureWebpack only babel-compiles terriajs's own lib/test dirs, so add a
  // rule that compiles this plugin's own TS/TSX source (src + spec) as well.
  configured.module.rules.push({
    test: /\.(ts|js)x?$/,
    include: [
      path.resolve(pluginBasePath, "src"),
      path.resolve(pluginBasePath, "spec")
    ],
    use: [defaultBabelLoader({ devMode })]
  });

  // The fork-ts-checker plugin configureWebpack adds points at terriajs's own
  // tsconfig — type-checking the whole terriajs project here is slow and not
  // useful for running specs, so drop it.
  configured.plugins = configured.plugins.filter(
    (p) =>
      p && p.constructor && p.constructor.name !== "ForkTsCheckerWebpackPlugin"
  );

  return configured;
}

// Support the webpack CLI's `(env, argv)` config-function signature.
module.exports = (_env, argv = {}) => makeConfig(argv.mode !== "production");
