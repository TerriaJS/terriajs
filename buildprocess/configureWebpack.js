var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var StringReplacePlugin = require("string-replace-webpack-plugin");
const cesiumDir = path.dirname(require.resolve('terriajs-cesium'));
const DirectoryLoader = require('./directory-loader');
const webpack = require('webpack');

function configureWebpack(terriaJSBasePath, config, devMode) {
    config.resolve = config.resolve || {};
    config.resolve.extensions = config.resolve.extensions || ['', '.webpack.js', '.web.js', '.js'];
    config.resolve.extensions.push('.jsx');
    config.resolve.alias = config.resolve.alias || {};

    config.module = config.module || {};
    config.module.loaders = config.module.loaders || [];

    config.module.loaders.push({
        test: /\.js?$/,
        include: path.dirname(require.resolve('terriajs-cesium')),
        exclude: [
            require.resolve('terriajs-cesium/Source/ThirdParty/zip'),
            require.resolve('terriajs-cesium/Source/Core/buildModuleUrl'),
            require.resolve('terriajs-cesium/Source/Core/TaskProcessor')
        ],
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /buildModuleUrl\([\'|\"](.*)[\'|\"]\)/ig,
                    replacement: function (match, p1, offset, string) {
                        return "require('" + cesiumDir + "/Source/" + p1 + "')";
                    }
                }
            ]
        })
    });

    config.module.loaders.push({
        test: /\.js?$/,
        include: require.resolve('terriajs-cesium/Source/ThirdParty/zip'),
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /new Worker\(obj\.zip\.workerScriptsPath \+(.*)\)/ig,
                    replacement: function (match, p1, offset, string) {
                        return "require('" + require.resolve('worker-loader') + "!" + cesiumDir + "/Source/ThirdParty/Workers/' + " + p1 + ")()";
                    }
                }
            ]
        })
    });

    config.module.loaders.push({
        test: /\.js?$/,
        include: require.resolve('terriajs-cesium/Source/Core/TaskProcessor'),
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /new Worker\(getBootstrapperUrl\(\)\)/ig,
                    replacement: function (match, p1, offset, string) {
                        return "require('" + require.resolve('worker-loader') + "!" + require.resolve('../lib/cesiumWorkerBootstrapper') + "')()";
                    }
                },
                {
                    pattern: "new Worker(getWorkerUrl('Workers/transferTypedArrayTest.js'))",
                    replacement: function (match, p1, offset, string) {
                        return "require('" + require.resolve('worker-loader') + "!" + cesiumDir + "/Source/Workers/transferTypedArrayTest.js')()";
                    }
                }
            ]
        })
    });

    config.module.loaders.push({
        test: /\.js?$/,
        include: path.dirname(require.resolve('terriajs-cesium')) + '/Source/Workers',
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /require\(\'Workers\/\' \+ moduleName\)/ig,
                    replacement: function (match, p1, offset, string) {
                        return "require('./' + moduleName)";
                    }
                }
            ]
        })
    });

    // Use Babel to compile our JavaScript files.
    config.module.loaders.push({
        test: /\.jsx?$/,
        include: [
            path.resolve(terriaJSBasePath, 'lib'),
            path.resolve(terriaJSBasePath, 'test')
        ],
        loader: require.resolve('babel-loader'),
        query: {
            sourceMap: false, // generated sourcemaps are currently bad, see https://phabricator.babeljs.io/T7257
            presets: ['es2015', 'react'],
            plugins: [
                require.resolve('jsx-control-statements')
            ]
        }
    });

    //

    // Use the raw loader for our view HTML.  We don't use the html-loader because it
    // will doing things with images that we don't (currently) want.
    config.module.loaders.push({
        test: /\.html$/,
        include: path.resolve(terriaJSBasePath, 'lib', 'Views'),
        loader: require.resolve('raw-loader')
    });

    // Allow XML in the models directory to be required-in as a raw text.
    config.module.loaders.push({
        test: /\.xml$/,
        include: path.resolve(terriaJSBasePath, 'lib', 'Models'),
        loader: require.resolve('raw-loader')
    });

    config.module.loaders.push({
        test: /\.json|xml$/,
        loader: require.resolve('file-loader'),
        include: cesiumDir + '/Source/Assets'
    });

    config.module.loaders.push({
        test: /\/Workers\/$/,
        loader: require.resolve('file-loader'),
        include: cesiumDir
    });

    config.module.loaders.push({
        test: /\.json$/,
        loader: require.resolve('json-loader')
    });

    // Don't let Cesium's `buildModuleUrl` and `TaskProcessor` see require - only the AMD version is relevant.
    config.module.loaders.push({
        test: require.resolve('terriajs-cesium/Source/Core/buildModuleUrl'),
        loader: require.resolve('imports-loader') + '?require=>false'
    });

    //config.module.loaders.push({
    //    test: require.resolve('terriajs-cesium/Source/Core/TaskProcessor'),
    //    loader: require.resolve('imports-loader') + '?require=>false'
    //});

    config.module.loaders.push({
        test: /\.(png|jpg|svg|gif)$/,
        loader: require.resolve('url-loader') + '?limit=8192'
    });

    config.module.loaders.push({
        test: /fonts\/.*\.woff(2)?(\?.+)?$/,
        loader: require.resolve('url-loader') + '?limit=10000&mimetype=application/font-woff'
    });

    config.module.loaders.push({
        test: /fonts\/.*\.(ttf|eot|svg)(\?.+)?/,
        loader: require.resolve('file-loader')
    });

    config.devServer = {
        stats: 'minimal',
        port: 3003,
        contentBase: 'wwwroot/',
        proxy: {
            '*': {
                target: 'http://localhost:3001',
                bypass: function (req, res, proxyOptions) {
                    if (req.url.indexOf('/proxy') !== 0 && req.url.indexOf('/proj4lookup') !== 0 &&
                        req.url.indexOf('/convert') !== 0 && req.url.indexOf('/proxydomains') !== 0 &&
                        req.url.indexOf('/errorpage') !== 0 && req.url.indexOf('/initfile') !== 0) {
                        return req.originalUrl;
                    }
                }
            }
        },
    };

    config.sassLoader = {
        includePaths: [path.resolve(__dirname, "../lib/Sass")]
    };

    config.plugins = (config.plugins || []).concat([
        new StringReplacePlugin()
    ]);


    if (devMode) {
        config.module.loaders.push({
            test: /\.scss$/,
            loaders: [require.resolve('style-loader'), require.resolve('css-loader') + '?sourceMap', require.resolve('sass-loader') + '?sourceMap']
        });
    } else {
        config.module.loaders.push({
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract(require.resolve('css-loader') + '?sourceMap!' + require.resolve('sass-loader') + '?sourceMap')
        });

        config.plugins.push(
            new ExtractTextPlugin("nationalmap.css", {
                disable: devMode
            })
        );
    }

    return config;
}

module.exports = configureWebpack;
