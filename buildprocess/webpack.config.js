'use strict';

/*global require*/
var glob = require('glob-all');
var configureWebpack = require('./configureWebpack');

var testGlob = ['./test/**/*.js', '!./test/Utility/*.js'];

var config = {
    entry: glob.sync(testGlob),
    output: {
        path: 'wwwroot/build',
        filename: 'TerriaJS-specs.js',
        publicPath: 'build/'
    },
    devtool: 'eval-source-map',
    module: {
        loaders: [
            {
                // Don't let jasmine-ajax detect require and import jasmine-core, because we bring
                // in Jasmine via a script tag instead.
                test: require.resolve('terriajs-jasmine-ajax'),
                loader: 'imports?require=>false'
            }
        ]
    }
};

configureWebpack(require.resolve('../package.json'), config);

module.exports = config;
