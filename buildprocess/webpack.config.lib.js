var configureWebpack = require('./configureWebpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var config = {
    entry: './terria.lib.js',
    output: {
        path: 'wwwroot/build',
        filename: 'terria.js',
        library: 'terria',
        libraryTarget: 'umd',
        umdNamedDefined: true
    },
    devtool: 'source-map',
    plugins: [
        new ExtractTextPlugin({filename: "terria.css", ignoreOrder: true})
    ]
};

configureWebpack(path.resolve(__dirname, '../'), config, false, false, ExtractTextPlugin);

module.exports = config;
