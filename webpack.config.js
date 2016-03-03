'use strict';

/*global require*/
var glob = require('glob-all');
var webpack = require("webpack");

var testGlob = ['./test/**/*.js', '!./test/Utility/*.js'];

module.exports = {
    entry: glob.sync(testGlob),
    output: {
        path: 'wwwroot/build',
        filename: 'TerriaJS-specs.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'transform?brfs'
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
};
