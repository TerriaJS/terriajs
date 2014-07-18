"use strict";

/*global require*/

var corsProxy = {
    getURL : function(resource) {
        return '/proxy/' + resource;
    },
    proxyDomains : []
};

corsProxy.withCredentials = function(username, password) {
    return {
        getURL : function(resource) {
            return '//' + username + ':' + password + '@' + window.location.host + corsProxy.getURL(resource);
        }
    };
};


corsProxy.shouldUseProxy = function(url) {

    var uri = new URI(url);
    var host = uri.host();
    var proxyAvail = proxyAllowedHost(host);

    if (proxyAvail && url.indexOf('http') !== -1) {
        return true;
    }
    return false;
};


//Non CORS hosts we proxy to
var proxyAllowedHost = function(host) {
    host = host.toLowerCase();
    var proxyDomains = corsProxy.proxyDomains;
    //check that host is from one of these domains
    for (var i = 0; i < proxyDomains.length; i++) {
        if (host.indexOf(proxyDomains[i], host.length - proxyDomains[i].length) !== -1) {
            return true;
        }
    }
    return false;
}


corsProxy.setProxyList = function(proxyDomains) {
    corsProxy.proxyDomains = proxyDomains;
}


module.exports = corsProxy;
