'use strict';

/*global require*/
var path = require('path');

function configureWebpack(terriaJSBasePath, config) {
    // Allow the base path to include package.json, because node doesn't allow `require.resolve('terriajs')`, sadly,
    // but `require.resolve('terriajs/package.json')` is fine.
    var packageJsonIndex = terriaJSBasePath.lastIndexOf('package.json');
    if (packageJsonIndex === terriaJSBasePath.length - 'package.json'.length) {
        terriaJSBasePath = terriaJSBasePath.substring(0, packageJsonIndex - 1);
    }

    config.module = config.module || {};
    config.module.loaders = config.module.loaders || [];

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

    // Allow proj4 to load its package.json via require, for some reason.
    config.module.loaders.push({
        test: require.resolve('proj4/package.json'),
        loader: require.resolve('json-loader')
    });

    // Allow entities to load its entities.json file.
    config.module.loaders.push({
        test: require.resolve('entities/maps/entities.json'),
        loader: require.resolve('json-loader')
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
}

module.exports = configureWebpack;
