'use strict';

/*global require*/
var corsProxy = require('../Core/corsProxy');

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');

var GoogleUrlShortener = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;
    this.url = defaultValue(options.url, 'https://www.googleapis.com/urlshortener/v1/url');
};

defineProperties(GoogleUrlShortener.prototype, {
    isUsable: {
        get: function() {
            return defined(this.terria.configParameters.googleUrlShortenerKey);
        }
    }
});

GoogleUrlShortener.prototype.shorten = function(url) {
    if (!this.isUsable) {
        throw new DeveloperError('GoogleUrlShortener is not usable because Terria.configPrameters.googleUrlShortenerKey is not defined.');
    }

    return loadWithXhr({
        url : this.url + '?key=' + this.terria.configParameters.googleUrlShortenerKey,
        method : "POST",
        data : JSON.stringify({"longUrl": url}),
        headers : {'Content-Type': 'application/json'},
        responseType : 'json'
    }).then(function(result) {
        var hashIndex = result.id.lastIndexOf('/');
        if (hashIndex === -1 || hashIndex >= result.id.length) {
            throw new RuntimeError('Unexpected url shortening result');
        }
        else {
            return result.id.substring(hashIndex+1);
        }
    });
};

/**
 * Expands the URL associated with a given token.
 *
 * @param {String} token The token for which to get the expanded URL.
 * @return {Promise|Object} A promise that resolves to the expanded URL.  If the token does not exist, the promise resolves to undefined.
 */
GoogleUrlShortener.prototype.expand = function(token) {
    if (!this.isUsable) {
        throw new DeveloperError('GoogleUrlShortener is not usable because Terria.configPrameters.googleUrlShortenerKey is not defined.');
    }

    var url = this.url + '?key=' + this.terria.configParameters.googleUrlShortenerKey + '&shortUrl=http://goo.gl/' + token;

    if (corsProxy.shouldUseProxy(url)) {
        url = corsProxy.getURL(url);
    }

    return loadJson(url).then(function(json) {
        return json.longUrl;
    }).otherwise(function() {
        return undefined;
    });
};

module.exports = GoogleUrlShortener;
