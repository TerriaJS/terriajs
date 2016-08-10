var glob = require('glob-all');
var configureWebpack = require('./configureWebpack');
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var testGlob = ['./test/**/*.js', './test/**/*.jsx', '!./test/Utility/*.js'];

module.exports = function(hot, dev) {
    var config = {
        entry: glob.sync(testGlob),
        output: {
            path: 'wwwroot/build',
            filename: 'TerriaJS-specs.js',
            publicPath: 'build/'
        },
        devtool: 'source-map',
        module: {
            loaders: [
                {
                    // Don't let jasmine-ajax detect require and import jasmine-core, because we bring
                    // in Jasmine via a script tag instead.
                    test: require.resolve('terriajs-jasmine-ajax'),
                    loader: 'imports?require=>false'
                }
            ]
        },
        devServer: {
            stats: 'minimal',
            port: 3002,
            contentBase: 'wwwroot/'
        },
        externals: {
            'cheerio': 'window',
            'react/addons': true,
            'react/lib/ExecutionEnvironment': true,
            'react/lib/ReactContext': true
        }
    };

    if (!dev) {
        config.plugins = [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin()
        ];
    }
    config.plugins = [new ExtractTextPlugin("nationalmap.css", {disable: false, ignoreOrder: true})];

    return configureWebpack(path.resolve(__dirname, '../'), config, hot, hot, ExtractTextPlugin, true);
};
