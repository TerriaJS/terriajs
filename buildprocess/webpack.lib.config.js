'use strict';

/*global require*/
var glob = require('glob-all');
var configureWebpack = require('./configureWebpack');
var webpack = require("webpack");

var config = {
    entry: './terria.lib.js',
    output: {
        path: 'wwwroot/build',
        filename: 'terria.js',
        library: 'terria',
        libraryTarget: 'umd',
        umdNamedDefined: true
    },
    devtool: 'source-map'
};

configureWebpack(require.resolve('../package.json'), config);

module.exports = config;
