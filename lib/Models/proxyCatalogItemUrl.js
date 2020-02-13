"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Proxies a URL associated with a catalog item, if necessary.
 * @param {CatalogItem} [catalogItem] The catalog item.
 * @param {string} url The URL.
 * @param {string} [cacheDuration] The cache duration to use if catalogItem.cacheDuration is undefined.
 * @returns {string} The URL, now cached if necessary.
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

  return corsProxy.getURL(
    url,
    defaultValue(catalogItem.cacheDuration, cacheDuration)
  );
};

module.exports = proxyCatalogItemUrl;
