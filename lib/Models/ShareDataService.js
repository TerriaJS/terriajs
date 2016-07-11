'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');

var TerriaError = require('../Core/TerriaError');

var ShareDataService = function(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    this.terria = options.terria;
    this.url = defaultValue(options.url, '/share');

    this._isUsable = undefined;
};

defineProperties(ShareDataService.prototype, {
    isUsable: {
        get: function() {
            return this._isUsable;
        }
    }
});

/**
 * Initialise the service, passing through server config options.
 * @param  {Object} serverConfig Options retrieved from ServerConfig.config.
 */
ShareDataService.prototype.init = function(serverConfig) {
    if (typeof serverConfig === 'object' && typeof serverConfig.newShareUrlPrefix === 'string') {
        this._isUsable = true;
    } else {
        this._isUsable = false;
    }
};

/**
 * Allocates a share token using Terria Server, storing the provided data there.
 * @param  {Object} shareData JSON to store.
 * @return {String} The token (which can later be resolved at /share/TOKEN).
 */
ShareDataService.prototype.getShareToken = function(shareData) {
    if (!this.isUsable) {
        throw new DeveloperError('ShareDataService is not usable.');
    }
    var that = this;

    return loadWithXhr({
        url : this.url,
        method : "POST",
        data : JSON.stringify(shareData),
        headers : {'Content-Type': 'application/json'},
        responseType : 'json'
    }).then(function(result) {
        return result.id;
    }).otherwise(function(error) {
        console.log(error);
        that.terria.error.raiseEvent(new TerriaError({
            title: 'Couldn\'t generate short URL.',
            message: 'Something went wrong when trying to use the share data service to generate a short URL. ' +
                     'If you believe it is a bug in ' + that.terria.appName + ', please report it by emailing ' +
                     '<a href="mailto:' + that.terria.supportEmail + '">' + that.terria.supportEmail + '</a>.'

        }));
    });
};

/**
 * Retrieves the share data JSON from a share token.
 *
 * @param {String} token The token identifying the data.
 * @return {Promise|Object} A promise that resolves to the JSON contents, or undefined if it's not available.
 */
ShareDataService.prototype.resolveData = function(token) {
    var that = this;
    
    if (!this.isUsable) {
        throw new DeveloperError('ShareDataService is not usable because ###');
    }

    return loadJson("/share/" + token)
        .then(function (json) {
            return json;
        }).otherwise(function () {
            that.terria.error.raiseEvent(new TerriaError({
                title: 'Couldn\'t expand URL',
                message: '\
The share data service used to launch ' + that.terria.appName + ' was not located. \
This may indicate an error in the link or that the service is unavailable at this time. \
If you believe it is a bug in ' + that.terria.appName + ', please report it by emailing \
<a href="mailto:' + that.terria.supportEmail + '">' + that.terria.supportEmail + '</a>.'
            })
        );

        return undefined;
    });
};

module.exports = ShareDataService;
