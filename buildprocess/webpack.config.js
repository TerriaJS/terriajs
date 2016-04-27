var glob = require('glob-all');
var configureWebpack = require('./configureWebpack');
var path = require('path');

var testGlob = ['./test/**/*.js', './test/**/*.jsx', '!./test/Utility/*.js'];

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
    worker: {
        output: {
            filename: "hash.worker.js",
            chunkFilename: "[id].hash.worker.js"
        }
    }
};

configureWebpack(path.resolve(__dirname, '../'), config);

module.exports = config;
