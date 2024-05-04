var glob = require("glob-all");
var configureWebpack = require("./configureWebpack");
var path = require("path");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");

//var testGlob = ['./test/**/*.js', './test/**/*.jsx', '!./test/Utility/*.js'];
var testGlob = [
  "./test/SpecMain.ts",
  "./test/**/*Spec.ts",
  "./test/**/*Spec.tsx",
  "./test/Models/Experiment.ts"
];

console.log(glob.sync(testGlob));
module.exports = function (hot, dev) {
  const terriaJSBasePath = path.resolve(__dirname, "../");
  var config = {
    mode: dev ? "development" : "production",
    entry: glob.sync(testGlob),
    output: {
      path: path.resolve(__dirname, "..", "wwwroot", "build"),
      filename: "TerriaJS-specs.js",
      publicPath: "build/"
    },
    // devtool: 'source-map',
    // Use eval cheap module source map for quicker incremental tests
    devtool: dev ? "eval-cheap-module-source-map" : "source-map",
    module: {
      rules: [
        {
          // Don't let jasmine-ajax detect require and import jasmine-core, because we bring
          // in Jasmine via a script tag instead.
          test: require.resolve("jasmine-ajax"),
          loader: "imports-loader?require=>false"
        }

        // {
        //   test: /\.(ts|js)x?$/,
        //   include: [path.resolve(terriaJSBasePath, "lib")],
        //   use: {
        //     loader: "@jsdevtools/coverage-istanbul-loader"
        //   },
        //   enforce: "post"
        // }
      ]
    },
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
    }
  };

  config.plugins = [
    new MiniCssExtractPlugin({
      filename: "nationalmap.css",
      disable: false,
      ignoreOrder: true
    })
  ];
  return configureWebpack(
    terriaJSBasePath,
    config,
    dev || hot,
    hot,
    MiniCssExtractPlugin,
    true
  );
};
