"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * The terriajs-server is the default server that proxies a URL associated with a catalog item, if necessary.
 * If catalogItem.proxyUrl is present, it will override the default proxy server.
 * @param {CatalogItem} [catalogItem] The catalog item.
 * @param {string} url The URL to be proxied.
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

  const proxyUrl = catalogItem.proxyUrl ? catalogItem.proxyUrl : undefined;

  const corsProxy = terria.corsProxy;
  if (!defined(corsProxy) && !defined(proxyUrl)) {
    return url;
  }

  if (
    !defined(proxyUrl) &&
    !corsProxy.shouldUseProxy(url) &&
    !catalogItem.forceProxy
  ) {
    return url;
  }

  if (defined(proxyUrl)) {
    return proxyUrl + "/" + url;
  } else {
    return corsProxy.getURL(
      url,
      defaultValue(catalogItem.cacheDuration, cacheDuration)
    );
  }
};

module.exports = proxyCatalogItemUrl;
