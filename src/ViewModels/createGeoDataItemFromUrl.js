'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var mapping = [];

/**
 * Creates a type derived from {@link GeoDataItemViewModel} based on a given URL.
 *
 * @param {String} url The derived type name.
 * @param {GeoDataCatalogContext} context The context for the item.
 * @returns {GeoDataItemViewModel} The constructed data item, or undefined if the URL is not supported.
 */
var createGeoDataItemFromUrl = function(url, context) {
    for (var i = 0; i < mapping.length; ++i) {
        var matcher = mapping[i];
        if (matcher.matcher(url)) {
            return new matcher.constructor(context, url);
        }
    }
    return undefined;
};

/**
 * Registers a constructor for a given type of {@link GeoDataItemViewModel}.
 * 
 * @param {createGeoDataItemFromUrl~Matcher} matcher A function that is given a URL to match as its only parameter.  If the function returns true, The type name for which to register a constructor.
 * @param {createGeoDataItemFromUrl~Constructor} constructor The constructor for data items that match the given matcher.
 */
 createGeoDataItemFromUrl.register = function(matcher, constructor) {
    mapping.push({
        matcher: matcher,
        constructor: constructor
    });
};

/**
 * Function interface for matching a URL to a {@link GeoDataItemViewModel} constructor
 * for that URL.
 * @callback createGeoDataItemFromUrl~Matcher
 * @param {String} url The URL to match.
 * @returns {Boolean} True if the constructor can be used with this URL; otherwise, false.
 *
 * @example
 * var czmlExtensionRegex = /\.czml$/i;
 * function isCzml(url) {
 *     return url.match(czmlExtensionRegex);
 * }
 */

 /**
  * Function interface for matching a URL to a {@link GeoDataItemViewModel} constructor
  * for that URL.
  * @callback createGeoDataItemFromUrl~Constructor
  * @param {GeoDataCatalogContext} context The context in which to create the {@link GeoDataItemViewModel}.
  * @param {String} url The URL from which to obtain the data.
  * @returns {GeoDataItemViewModel} The created data item.
  */

module.exports = createGeoDataItemFromUrl;