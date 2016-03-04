'use strict';

/*global require*/
var glob = require('glob-all');
var configureWebpack = require('./buildprocess/configureWebpack');

var testGlob = ['./test/**/*.js', '!./test/Utility/*.js'];

var config = {
    entry: glob.sync(testGlob),
    output: {
        path: 'wwwroot/build',
        filename: 'TerriaJS-specs.js',
        publicPath: 'build/'
    },
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
    plugins: [
        //new webpack.optimize.UglifyJsPlugin()
    ]
};

configureWebpack(__dirname, config);

module.exports = config;
