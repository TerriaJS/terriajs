/**
 * Rspack config for building specs
 */

// @ts-check

"use strict";

const glob = require("fast-glob");
const { CssExtractRspackPlugin } = require("@rspack/core");
const configureRspack = require("./configureRspack");
const path = require("path");

const testGlob = [
  "./test/SpecMain.ts",
  "./test/**/*Spec.ts",
  "./test/**/*Spec.tsx",
  "./test/Models/Experiment.ts"
];

const files = glob.sync(testGlob);
console.log(files);

module.exports = function (/** @type {boolean} */ devMode) {
  const terriaJSBasePath = path.resolve(__dirname, "../");

  // base config for specs
  /** @type {import('@rspack/cli').Configuration} */
  const config = {
    mode: devMode ? "development" : "production",
    entry: files,
    output: {
      path: path.resolve(__dirname, "..", "wwwroot", "build"),
      filename: "TerriaJS-specs.js",
      publicPath: "build/"
    },
    // Use eval cheap module source map for quicker incremental tests
    devtool: devMode ? "eval-cheap-module-source-map" : "source-map",
    devServer: {
      port: 3002
      // contentBase: "wwwroot/"
    },
    externals: {
      cheerio: "window",
      "react/addons": true,
      "react/lib/ExecutionEnvironment": true,
      "react/lib/ReactContext": true
    },
    resolve: {
      alias: {},
      modules: ["node_modules"]
    },
    plugins: [
      new CssExtractRspackPlugin({
        ignoreOrder: true
      })
    ],
    module: {
      rules: [
        // handle imports of text fixtures from specs
        {
          test: /\.(csv|xml)$/i,
          include: [path.resolve(terriaJSBasePath, "wwwroot", "test")],
          type: "asset/source"
        }
      ]
    }
  };
  if (devMode) {
    // Enable cache with devMode.
    config.experiments = {
      cache: {
        type: "persistent",
        buildDependencies: [
          __filename,
          path.join(__dirname, "configureRspack.js"),
          path.join(__dirname, "..", "tsconfig.json"),
          path.join(__dirname, "..", "tsconfig-node.json")
        ]
      }
    };
  }

  return configureRspack({
    terriaJSBasePath,
    config,
    devMode,
    CssExtractRspackPlugin
  });
};
