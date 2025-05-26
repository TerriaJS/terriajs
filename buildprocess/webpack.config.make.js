/**
 * Webpack config for building specs
 */

const glob = require("fast-glob");
const configureWebpack = require("./configureWebpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const testGlob = [
  "./test/SpecMain.ts",
  "./test/**/*Spec.ts",
  "./test/**/*Spec.tsx",
  "./test/Models/Experiment.ts"
];

const files = glob.sync(testGlob);
console.log(files);

module.exports = function (devMode) {
  const terriaJSBasePath = path.resolve(__dirname, "../");

  // base config for specs
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
      stats: "minimal",
      port: 3002,
      contentBase: "wwwroot/"
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
      new MiniCssExtractPlugin({
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

  return configureWebpack({
    terriaJSBasePath,
    config,
    devMode,
    MiniCssExtractPlugin
  });
};
