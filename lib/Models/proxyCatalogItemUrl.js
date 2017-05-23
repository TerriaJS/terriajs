'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Proxies a URL by appending it to {@link CorsProxy#baseProxyUrl}.
 * Optionally inserts a proxyFlag that will override the cache headers of the response, allowing for caching to
 * be added where it wouldn't otherwise.
 * @param  {CatalogItem} catalogItem The catalog item whose terria's corsProxy property and cacheDuration property should be used.
 * @param  {String} url The url
 * @param {String} [cacheDuration] [description] The length of time that you want to override the cache headers with. E.g. '2d' for 2 days.
 * @return {String} The proxy URL.
 */
var proxyCatalogItemUrl = function(catalogItem, url, cacheDuration) {
    if (!defined(catalogItem)) {
        return url;
    }

    var terria = catalogItem.terria;
    if (!defined(terria)) {
        return url;
    }

    var corsProxy = terria.corsProxy;
    if (!defined(corsProxy)) {
        return url;
    }

    if (!corsProxy.shouldUseProxy(url) && !catalogItem.forceProxy) {
        return url;
    }

    return corsProxy.getURL(url, defaultValue(cacheDuration, catalogItem.cacheDuration));
};

module.exports = proxyCatalogItemUrl;
