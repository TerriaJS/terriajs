"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

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
