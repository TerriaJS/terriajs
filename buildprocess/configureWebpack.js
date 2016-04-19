var path = require('path');

function configureWebpack(terriaJSBasePath, config) {
    config.resolve = config.resolve || {};
    config.resolve.extensions = config.resolve.extensions || ['', '.webpack.js', '.web.js', '.js'];
    config.resolve.extensions.push('.jsx');

    config.module = config.module || {};
    config.module.loaders = config.module.loaders || [];

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
        test: /\.json$/,
        loader: 'json'
    });

    // Don't let Cesium's `buildModuleUrl` and `TaskProcessor` see require - only the AMD version is relevant.
    config.module.loaders.push({
        test: require.resolve('terriajs-cesium/Source/Core/buildModuleUrl'),
        loader: require.resolve('imports-loader') + '?require=>false'
    });
    config.module.loaders.push({
        test: require.resolve('terriajs-cesium/Source/Core/TaskProcessor'),
        loader: require.resolve('imports-loader') + '?require=>false'
    });

    config.module.loaders.push({
        test: /\.scss$/,
        loaders: [require.resolve('style-loader'), require.resolve('css-loader') + '?sourceMap', require.resolve('sass-loader') + '?sourceMap']
    });

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

    return config;
}

module.exports = configureWebpack;
