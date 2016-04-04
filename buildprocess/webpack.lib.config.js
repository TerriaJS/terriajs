/*eslint-env node*/

'use strict';

/*global require*/
var configureWebpack = require('./configureWebpack');
var path = require('path');

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

configureWebpack(path.resolve(__dirname, '../'), config);

module.exports = config;
