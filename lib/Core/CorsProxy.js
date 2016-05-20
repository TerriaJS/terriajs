"use strict";

/*global require*/
var URI = require('urijs');

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');

function CorsProxy(config, configParameters) {
    this.baseProxyUrl = 'proxy/';
    this.proxyDomains = [];     // domains that should be proxied for, as set by config files
    this.isOpenProxy = false; // true if the proxy will proxy for anything.
    this.corsDomains = [];      // domains that are known to support CORS, as set by config files
    this.alwaysUseProxy = FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 10; // IE versions prior to 10 don't support CORS, so always use the proxy.
    this.pageIsHttps = typeof window !== 'undefined' && defined(window.location) && defined(window.location.href) && new URI(window.location.href).protocol() === 'https';
}

CorsProxy.prototype.init = function(config, configParameters) {
    this.baseProxyUrl = defaultValue(configParameters.corsProxyBaseUrl, this.baseProxyUrl);
    this.proxyDomains = defaultValue(config.proxyDomains, this.proxyDomains);

    this.initPromise = loadJson(configParameters.proxyableDomainsUrl).then(function(proxyableDomains) {
        if (proxyableDomains.proxyAllDomains) {
            this.isOpenProxy = true;
        }
        this.proxyDomains.push.apply(this.proxyDomains, proxyableDomains.proxyableDomains);
    }.bind(this)).otherwise(function() {
        console.log('Failed to resolve proxyableDomains from ' + configParameters.proxyableDomainsUrl);
    });

    return this.initPromise;
};

CorsProxy.prototype.getURLProxyIfNecessary = function (resource, proxyFlag) {
    if (this.shouldUseProxy(resource)) {
        return this.getURL(resource, proxyFlag);
    }

    return resource;
};

CorsProxy.prototype.getURL = function (resource, proxyFlag) {
    var flag = (proxyFlag === undefined) ? '' : '_' + proxyFlag + '/';
    return this.baseProxyUrl + flag + resource;
};

/**
 * Determines if the proxying service should be used to access the given URL, based on our list of
 * domains we're willing to proxy for and hosts that are known to support CORS.
 *
 * @return {Boolean} true if the proxy should be used, false if not.
 */
CorsProxy.prototype.shouldUseProxy = function(url) {
    if (!defined(url)) {
        // eg. no url may be passed if all data is embedded
        return false;
    }

    var uri = new URI(url);
    var host = uri.host();

    if (host === '') {
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

    if (this.pageIsHttps && uri.protocol() === 'http') {
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

/* Is this host a (sub)domain in the provided list? */
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
