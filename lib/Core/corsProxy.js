"use strict";

/*global require*/
var URI = require('urijs');

var defined = require('terriajs-cesium/Source/Core/defined');

var corsProxy = {
    baseProxyUrl: 'proxy/',
    getURL : function(resource, proxyFlag) {
        var flag = (proxyFlag === undefined) ? '' : '_' + proxyFlag + '/';
        return corsProxy.baseProxyUrl + flag + resource;
    },
    proxyDomains : [],     // domains that should be proxied for, as set by config files
    isOpenProxy : false, // true if the proxy will proxy for anything.
    corsDomains : [],      // domains that are known to support CORS, as set by config files
    alwaysUseProxy : false, // use proxy on all domains, for browsers that don't support CORS
    pageIsHttps : typeof window !== 'undefined' && defined(window.location) && defined(window.location.href) && new URI(window.location.href).protocol() === 'https'
};

/**
 * Determines if the proxying service should be used to access the given URL, based on our list of
 * domains we're willing to proxy for and hosts that are known to support CORS.
 *
 * @return {Boolean} true if the proxy should be used, false if not.
 */
corsProxy.shouldUseProxy = function(url) {
    if (!defined(url)) {
        // eg. no url may be passed if all data is embedded
        return false;
    }

    var uri = new URI(url);
    var host = uri.host();

    if (!corsProxy.isOpenProxy && !hostInDomains(host, corsProxy.proxyDomains)) {
        // we're not willing to proxy for this host
        return false;
    }
    if (corsProxy.alwaysUseProxy) {
        return true;
    }

    if (corsProxy.pageIsHttps && uri.protocol() === 'http') {
        // if we're accessing an http resource from an https page, always proxy in order to avoid a mixed content error.
        return true;
    }

    if (hostInDomains(host, corsProxy.corsDomains)) {
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

module.exports = corsProxy;
