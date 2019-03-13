var glob = require('glob-all');
var configureWebpack = require('./configureWebpack');
var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

//var testGlob = ['./test/**/*.js', './test/**/*.jsx', '!./test/Utility/*.js'];
var testGlob = [
    './test/SpecMain.ts',
    './test/Models/Experiment.ts',
    './test/Models/StratumOrderSpec.ts',
    './test/Models/WebMapServiceCatalogItemSpec.ts',
    './test/Models/WebMapServiceCatalogGroupSpec.ts',
    './test/Traits/objectTraitSpec.ts',
    './test/Traits/objectArrayTraitSpec.ts',
    './test/Models/LoadableStratumSpec.ts',
    './test/Models/upsertModelFromJsonSpec.ts'
];

module.exports = function(hot, dev) {
    var config = {
        mode: dev ? 'development' : 'production',
        entry: glob.sync(testGlob),
        output: {
            path: path.resolve(__dirname, '..', 'wwwroot', 'build'),
            filename: 'TerriaJS-specs.js',
            publicPath: 'build/'
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    // Don't let jasmine-ajax detect require and import jasmine-core, because we bring
                    // in Jasmine via a script tag instead.
                    test: require.resolve('terriajs-jasmine-ajax'),
                    loader: 'imports-loader?require=>false'
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
        },
        resolve: {
            alias: {},
            modules: ['node_modules']
        }
    };

    config.plugins = [new MiniCssExtractPlugin({filename: "nationalmap.css", disable: false, ignoreOrder: true})];

    return configureWebpack(path.resolve(__dirname, '../'), config, hot, hot, MiniCssExtractPlugin, true);
};
