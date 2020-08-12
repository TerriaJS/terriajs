var configureWebpackForTerriaJS = require('terriajs/buildprocess/configureWebpack');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var path = require('path');

module.exports = function() {
  const config = {
      mode: 'development',
      entry: path.resolve(__dirname, 'generateDocs.js'),
      output: {
          path: path.resolve(__dirname, '..', 'modeldocs'),
          filename: 'gendocs.js',
          sourcePrefix: '', // to avoid breaking multi-line string literals by inserting extra tabs.
          globalObject: '(self || window)' // to avoid breaking in web worker (https://github.com/webpack/webpack/issues/6642)
      },
      target: 'node',
      resolve: {
        alias: {},
        modules: ['node_modules']
      }
  };
  return configureWebpackForTerriaJS(
    path.dirname(require.resolve('../package.json')),
    config,
    true,
    // devMode,
    // hot,
    false,
    MiniCssExtractPlugin
  );
}
