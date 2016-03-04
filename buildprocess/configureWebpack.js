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

    // Make brfs-style `readFileSync` calls work.  We should probably use the html loader instead.
    config.module.loaders.push({
        test: /\.js$/,
        include: path.resolve(terriaJSBasePath, 'lib'),
        loader: require.resolve('transform-loader') + '?' + require.resolve('brfs')
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
