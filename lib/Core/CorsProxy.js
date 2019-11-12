"use strict";

/*global require*/
var URI = require("urijs");

var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var loadJson = require("./loadJson");
var FeatureDetection = require("terriajs-cesium/Source/Core/FeatureDetection")
  .default;

var DEFAULT_BASE_PROXY_PATH = "proxy/";

/**
 * Rewrites URLs so that they're resolved via the TerriaJS-Server proxy rather than going direct. This is most useful
 * for getting around CORS restrictions on services that don't have CORS set up or when using pre-CORS browsers like IE9.
 * Going via the proxy is also useful if you want to change the caching headers on map requests (for instance many map
 * tile providers set cache headers to no-cache even for maps that rarely change, resulting in a much slower experience
 * particularly on time-series data).
 *
 * @param overrideLoadJson A method for getting JSON from a URL that matches the signature of Core/loadJson
 *      module - this is overridable mainly for testing.
 * @constructor
 */
function CorsProxy(overrideLoadJson) {
  this.loadJson = defaultValue(overrideLoadJson, loadJson);

  // Note that many of the following are intended to be set by a request to the server performed in {@link CorsProxy#init},
  // but these can be overridden if necessary.

  /**
   * The base URL of the TerriaJS server proxy, to which requests will be appended. In most cases this is the server's
   * host + '/proxy'.
   * @type {String}
   */
  this.baseProxyUrl = undefined;
  /**
   *  Domains that should be proxied for, as set by config files. Stored as an array of hosts - if a TLD is specified,
   * subdomains will also be proxied.
   *  @type {String[]}
   */
  this.proxyDomains = undefined;
  /**
   * True if we expect that the proxy will proxy any URL - note that if the server isn't set up to do this, having
   * this set to true will just result in a lot of failed AJAX calls
   * @type {boolean}
   */
  this.isOpenProxy = false;
  /**
   * Domains that are known to support CORS, as set by config files.
   * @type {String[]}
   */
  this.corsDomains = [];
  /**
   * Whether the proxy should be used regardless of whether the domain supports CORS or not. This defaults to true
   * on IE<10.
   * @type {boolean}
   */
  this.alwaysUseProxy =
    FeatureDetection.isInternetExplorer() &&
    FeatureDetection.internetExplorerVersion()[0] < 10; // IE versions prior to 10 don't support CORS, so always use the proxy.
  /**
   * Whether the page that Terria is running on is HTTPS. This is relevant because calling an HTTP domain from HTTPS
   * results in mixed content warnings and going through the proxy is required to get around this.
   * @type {boolean}
   */
  this.pageIsHttps =
    typeof window !== "undefined" &&
    defined(window.location) &&
    defined(window.location.href) &&
    new URI(window.location.href).protocol() === "https";
}

/**
 * Initialises values with config previously loaded from server. This is the recommended way to use this object as it ensures
 * the options will be correct for the proxy server it's configured to call, but this can be skipped and the values it
 * initialises set manually if desired.
 *
 * @param {Object} serverConfig Configuration options retrieved from a ServerConfig object.
 * @param {String} baseProxyUrl The base URL to proxy with - this will default to 'proxy/'
 * @param {String[]} proxyDomains Initial value for proxyDomains to which proxyable domains from the server will be appended -
 *      defaults to an empty array.
 * @returns {Promise} A promise that resolves when initialisation is complete.
 */
CorsProxy.prototype.init = function(serverConfig, baseProxyUrl, proxyDomains) {
  this.baseProxyUrl = defaultValue(baseProxyUrl, DEFAULT_BASE_PROXY_PATH);
  this.proxyDomains = defaultValue(proxyDomains, []);
  if (serverConfig && typeof serverConfig === "object") {
    this.isOpenProxy = !!serverConfig.proxyAllDomains;
    // ignore client list of allowed proxies in favour of definitive server list.
    if (Array.isArray(serverConfig.allowProxyFor)) {
      this.proxyDomains = serverConfig.allowProxyFor;
    }
  }
};

/**
 * Determines if the proxying service should be used to access the given URL, based on our list of
 * domains we're willing to proxy for and hosts that are known to support CORS.
 *
 * @param {String} url The url to examine.
 * @return {Boolean} true if the proxy should be used, false if not.
 */
CorsProxy.prototype.shouldUseProxy = function(url) {
  if (!defined(url)) {
    // eg. no url may be passed if all data is embedded
    return false;
  }

  var uri = new URI(url);
  var host = uri.host();

  if (host === "") {
    // do not proxy local files
    return false;
  }

  if (!this.isOpenProxy && !hostInDomains(host, this.proxyDomains)) {
    // we're not willing to proxy for this host
    return false;
  }
  if (this.alwaysUseProxy) {
    return true;
  }

  if (this.pageIsHttps && uri.protocol() === "http") {
    // if we're accessing an http resource from an https page, always proxy in order to avoid a mixed content error.
    return true;
  }

  if (hostInDomains(host, this.corsDomains)) {
    // we don't need to proxy for this host, because it supports CORS
    return false;
  }

  // we are ok with proxying for this host and we need to
  return true;
};

/**
 * Proxies a URL by appending it to {@link CorsProxy#baseProxyUrl}. Optionally inserts a proxyFlag that will override
 * the cache headers of the response, allowing for caching to be added where it wouldn't otherwise.
 *
 * @param {String} resource the URL to potentially proxy
 * @param {String} proxyFlag the proxy flag to pass - generally this is the length of time that you want to override
 *       the cache headers with. E.g. '2d' for 2 days.
 * @returns {String} The proxied URL
 */
CorsProxy.prototype.getURL = function(resource, proxyFlag) {
  var flag = proxyFlag === undefined ? "" : "_" + proxyFlag + "/";
  return this.baseProxyUrl + flag + resource;
};

/**
 * Convenience method that combines {@link CorsProxy#shouldUseProxy} and {@link getURL} - if the URL passed needs to be
 * proxied according to the rules/config of the proxy, this will return a proxied URL, otherwise it will return the
 * original URL.
 *
 * {@see CorsProxy#shouldUseProxy}
 * {@see CorsProxy#getURL}
 *
 * @param {String} resource the URL to potentially proxy
 * @param {String} proxyFlag the proxy flag to pass - generally this is the length of time that you want to override
 *       the cache headers with. E.g. '2d' for 2 days.
 * @returns {String} Either the URL passed in or a proxied URL if it should be proxied.
 */
CorsProxy.prototype.getURLProxyIfNecessary = function(resource, proxyFlag) {
  if (this.shouldUseProxy(resource)) {
    return this.getURL(resource, proxyFlag);
  }

  return resource;
};

/**
 * Determines whether this host is, or is a subdomain of, an item in the provided array.
 *
 * @param {String} host The host to search for
 * @param {String[]} domains The array of domains to look in
 * @returns {boolean} The result.
 */
function hostInDomains(host, domains) {
  if (!defined(domains)) {
    return false;
  }

  host = host.toLowerCase();
  for (var i = 0; i < domains.length; i++) {
    if (host.match("(^|\\.)" + domains[i] + "$")) {
      return true;
    }
  }
  return false;
}

module.exports = CorsProxy;
