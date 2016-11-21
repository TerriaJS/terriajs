'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Proxies a URL by appending it to {@link CorsProxy#baseProxyUrl} or {@link CorsProxy#baseProxyWithKeyUrl}.
 * Optionally inserts a proxyFlag that will override the cache headers of the response, allowing for caching to
 * be added where it wouldn't otherwise.
 * @param  {CatalogItem} catalogItem The catalog item whose terria's corsProxy property and cacheDuration property should be used.
 * @param  {String} url The url
 * @param  {Object|String} [options] This can be either a cacheDuration string (see below), or an object of options:
 * @param {String} [options.cacheDuration] [description] The length of time that you want to override the cache headers with. E.g. '2d' for 2 days.
 * @param {String} [options.keyType] A key type available in the serverconfig, in its 'keys' property.
 * @return {String} The proxy URL.
 */
var proxyCatalogItemUrl = function(catalogItem, url, options) {
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

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    if (typeof options === 'string' || options instanceof String) {
        // For backwards compatibility, if options is a string, it is a cacheDuration.
        options = {cacheDuration: options};
    }

    return corsProxy.getURL(url, defaultValue(options.cacheDuration, catalogItem.cacheDuration), options.keyType);
};

module.exports = proxyCatalogItemUrl;
