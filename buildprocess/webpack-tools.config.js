const configureWebpackForTerriaJS = require("./configureWebpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { IgnorePlugin } = require("webpack");

module.exports = function () {
  const config = {
    mode: "development",
    entry: {
      generateDocs: path.resolve(__dirname, "generateDocs.ts"),
      generateCatalogIndex: path.resolve(__dirname, "generateCatalogIndex.ts")
    },
    output: {
      path: path.resolve(__dirname, "..", "build"),
      filename: "[name].js",
      sourcePrefix: "", // to avoid breaking multi-line string literals by inserting extra tabs.
      globalObject: "(self || window)" // to avoid breaking in web worker (https://github.com/webpack/webpack/issues/6642)
    },
    target: "node",
    resolve: {
      alias: {},
      modules: ["node_modules"],
      extensions: [".ts", ".js", ".jsx", ".tsx", ".json"]
    },
    externals: {
      vue: "vue"
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "TerriaJS.css",
        ignoreOrder: true
      }),
      // This is needed for a jsdom issue
      new IgnorePlugin(/canvas/, /jsdom$/)
    ]
  };
  return configureWebpackForTerriaJS(
    path.dirname(require.resolve("../package.json")),
    config,
    true,
    // devMode,
    // hot,
    false,
    MiniCssExtractPlugin
  );
};
